/**
 * DEPOSIT WORKER THREAD
 * 
 * PURPOSE:
 * - Offload ZK proof generation dari main thread
 * - Prevent event loop blocking (502 timeout fix)
 * - Allow Express tetap responsive saat deposit running
 * 
 * ARCHITECTURE:
 * Main Thread (Express) → spawn Worker → ZK computation → return result
 * 
 * WHY WORKER THREAD?
 * - ZK proof generation = CPU intensive synchronous computation
 * - Blocking main thread = freeze Express = Railway timeout 502
 * - Worker thread = isolated V8 context = main thread tetap jalan
 */

import { Worker } from "worker_threads";
import { Keypair } from "@solana/web3.js";
import { PrivacyCash } from "privacycash";

/**
 * Helper function untuk spawn worker dari main thread
 * 
 * @param {Object} config - Worker configuration
 * @param {string} config.rpcUrl - Solana RPC URL
 * @param {Uint8Array} config.relayerSecretKey - Relayer keypair secret
 * @param {number} config.lamports - Amount to deposit
 * @param {string} [config.referrer] - Optional referrer address
 * @param {number} [config.timeout=60000] - Timeout in ms (default 60s)
 * @returns {Promise<Object>} Deposit result
 */
export async function runDepositWorker(config) {
  return new Promise((resolve, reject) => {
    const timeout = config.timeout || 60000; // Default 60s
    
    // Reconstruct keypair untuk dikirim ke worker
    const relayerKeypair = Keypair.fromSecretKey(config.relayerSecretKey);

    // Worker code as string (inline execution)
    const workerCode = `
      import { Keypair } from "@solana/web3.js";
      import { PrivacyCash } from "privacycash";
      import { parentPort, workerData } from "worker_threads";

      (async () => {
        try {
          const { rpcUrl, relayerSecretKey, lamports, referrer } = workerData;
          
          const relayerKeypair = Keypair.fromSecretKey(
            Uint8Array.from(relayerSecretKey)
          );
          
          const privacyCashClient = new PrivacyCash({
            RPC_url: rpcUrl,
            owner: relayerKeypair
          });
          
          console.log(\`⚙️  [WORKER] Starting ZK deposit: \${lamports} lamports\`);
          const startTime = Date.now();
          
          const result = await privacyCashClient.deposit({
            lamports,
            referrer: referrer || undefined
          });
          
          const duration = Date.now() - startTime;
          console.log(\`✅ [WORKER] ZK deposit complete in \${duration}ms\`);
          
          parentPort.postMessage({
            success: true,
            result,
            duration
          });
        } catch (error) {
          console.error("❌ [WORKER] ZK deposit failed:", error);
          parentPort.postMessage({
            success: false,
            error: error.message,
            stack: error.stack
          });
        }
      })();
    `;
    
    // Spawn worker thread dengan eval (ESM compatible)
    const worker = new Worker(workerCode, {
      eval: true,
      workerData: {
        rpcUrl: config.rpcUrl,
        relayerSecretKey: Array.from(config.relayerSecretKey),
        lamports: config.lamports,
        referrer: config.referrer
      }
    });

    // Timeout handler (prevent infinite hang)
    const timeoutId = setTimeout(() => {
      worker.terminate();
      reject(new Error(`Deposit timeout after ${timeout}ms`));
    }, timeout);

    // Success/Error handler
    worker.on("message", (message) => {
      clearTimeout(timeoutId);
      worker.terminate();

      if (message.success) {
        resolve(message.result);
      } else {
        reject(new Error(message.error));
      }
    });

    // Worker error handler
    worker.on("error", (error) => {
      clearTimeout(timeoutId);
      worker.terminate();
      reject(error);
    });

    // Worker exit handler (crash detection)
    worker.on("exit", (code) => {
      clearTimeout(timeoutId);
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}
