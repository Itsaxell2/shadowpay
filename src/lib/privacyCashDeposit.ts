/**
 * Privacy Cash SDK Integration
 * 
 * Official Privacy Cash SDK wrapper for browser environment.
 * SDK handles: ZK proofs, Merkle trees, nullifiers, UTXO encryption.
 * 
 * IMPORTANT: SDK designed for Node.js, browser support via polyfills.
 * See src/polyfills.ts and vite.config.ts for compatibility layer.
 */

import { 
  Connection, 
  PublicKey,
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import { PrivacyCash } from "privacycash";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

// Official Privacy Cash Program ID (mainnet-beta)
export const PRIVACY_CASH_PROGRAM_ID = new PublicKey(
  "9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD"
);

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface DepositResult {
  txSignature: string;
  success: boolean;
}

export interface WithdrawResult {
  txSignature: string;
  success: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRIVACY CASH SDK INSTANCE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

let privacyCashInstance: PrivacyCash | null = null;

/**
 * Initialize Privacy Cash SDK instance
 * 
 * @param rpcUrl - Solana RPC URL (must be mainnet for Privacy Cash)
 * @param walletAdapter - Phantom wallet adapter (publicKey + signTransaction)
 * @param enableDebug - Enable SDK debug logging
 * 
 * @returns Initialized PrivacyCash instance
 */
export async function initializePrivacyCash(
  rpcUrl: string,
  walletAdapter: any, // Phantom wallet adapter interface
  enableDebug: boolean = true
): Promise<PrivacyCash> {
  console.log("🔐 Initializing Privacy Cash SDK...");
  console.log("   RPC:", rpcUrl);
  console.log("   Wallet:", walletAdapter.publicKey);
  
  // SDK accepts wallet adapter, not raw keypair
  privacyCashInstance = new PrivacyCash({
    RPC_url: rpcUrl,
    owner: walletAdapter,
    enableDebug,
  });
  
  console.log("✅ Privacy Cash SDK initialized");
  return privacyCashInstance;
}

/**
 * Get or create Privacy Cash SDK instance
 */
export function getPrivacyCashInstance(): PrivacyCash {
  if (!privacyCashInstance) {
    throw new Error("Privacy Cash SDK not initialized. Call initializePrivacyCash first.");
  }
  return privacyCashInstance;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEPOSIT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Deposit SOL using Privacy Cash SDK
 * OFFICIAL FLOW: SDK handles everything end-to-end
 * 
 * Architecture Flow:
 * 1. Browser: SDK generates ZK proof
 * 2. Browser: SDK builds transaction (user = fee payer)
 * 3. Browser: User signs with Phantom
 * 4. Browser: SDK submits directly to Solana blockchain
 * 
 * NO BACKEND/RELAYER - SDK does direct blockchain submission
 * 
 * @param amountLamports - Amount to deposit in lamports
 * @param privacyCash - Privacy Cash SDK instance (with user wallet)
 * @param linkId - Optional payment link ID (for tracking only)
 * 
 * @returns DepositResult with tx signature
 */
export async function depositSOL({
  amountLamports,
  privacyCash,
  linkId,
}: {
  amountLamports: number;
  privacyCash: PrivacyCash;
  linkId?: string;
}): Promise<DepositResult> {
  console.log("💰 Starting Privacy Cash deposit...");
  console.log("   Amount:", amountLamports / LAMPORTS_PER_SOL, "SOL");
  console.log("   Link ID:", linkId || "N/A");

  try {
    console.log("\n🔐 Privacy Cash SDK will:");
    console.log("   1. Generate ZK proof (10-30 seconds)");
    console.log("   2. Build transaction");
    console.log("   3. Request signature via Phantom");
    console.log("   4. Submit directly to Solana");

    // SDK handles EVERYTHING: ZK proof → build → sign → submit
    // User wallet is fee payer and signs transaction
    const result = await privacyCash.deposit({
      lamports: amountLamports,
    });

    console.log("\n🎉 DEPOSIT COMPLETE!");
    console.log("   ✅ TX:", result.tx);
    console.log("   ✅ ZK proof generated");
    console.log("   ✅ Commitment stored on-chain");
    console.log("   ✅ UTXO encrypted");

    // Optional: Notify backend for tracking (not required for deposit)
    if (linkId) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (apiUrl) {
          await fetch(`${apiUrl}/privacy/deposit-complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              linkId,
              txSignature: result.tx,
              amountLamports,
            }),
          }).catch(err => console.warn('Backend notification failed (non-critical):', err));
        }
      } catch (err) {
        console.warn('Backend tracking notification failed (non-critical):', err);
      }
    }

    return {
      txSignature: result.tx,
      success: true,
    };
  } catch (error) {
    console.error("\n❌ DEPOSIT FAILED:", error);
    console.error("   Check:");
    console.error("   - User wallet has SOL for fees");
    console.error("   - Wallet is on mainnet-beta");
    console.error("   - Privacy Cash SDK initialized correctly");
    throw error;
  }
}

/**
 * Deposit USDC using Privacy Cash SDK
 * 
 * @param amountBaseUnits - Amount in USDC base units (1 USDC = 1000000 base units)
 * @param privacyCash - Privacy Cash SDK instance
 * 
 * @returns DepositResult with tx signature
 */
export async function depositUSDC({
  amountBaseUnits,
  privacyCash,
}: {
  amountBaseUnits: number;
  privacyCash: PrivacyCash;
}): Promise<DepositResult> {
  console.log("💰 Starting Privacy Cash USDC deposit (SDK)...");
  console.log("   Amount:", amountBaseUnits / 1000000, "USDC");

  try {
    const result = await privacyCash.depositUSDC({
      base_units: amountBaseUnits,
    });

    console.log("\n🎉 USDC DEPOSIT COMPLETE!");
    console.log("   TX:", result.tx);

    return {
      txSignature: result.tx,
      success: true,
    };
  } catch (error) {
    console.error("\n❌ USDC DEPOSIT FAILED:", error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WITHDRAWAL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Withdraw SOL using Privacy Cash SDK
 * 
 * @param amountLamports - Amount to withdraw in lamports
 * @param recipientAddress - Recipient's Solana address
 * @param privacyCash - Privacy Cash SDK instance
 * @param referrer - Optional referrer address
 * 
 * @returns WithdrawResult with tx signature
 */
export async function withdrawSOL({
  amountLamports,
  recipientAddress,
  privacyCash,
  referrer,
}: {
  amountLamports: number;
  recipientAddress: string;
  privacyCash: PrivacyCash;
  referrer?: string;
}): Promise<WithdrawResult> {
  console.log("💸 Starting Privacy Cash withdrawal (SDK)...");
  console.log("   Amount:", amountLamports / LAMPORTS_PER_SOL, "SOL");
  console.log("   Recipient:", recipientAddress);

  try {
    console.log("\n🔐 Calling Privacy Cash SDK withdraw()...");
    console.log("   ⏳ SDK will generate ZK proof for withdrawal...");

    const result = await privacyCash.withdraw({
      lamports: amountLamports,
      recipientAddress,
      referrer,
    });

    console.log("\n🎉 WITHDRAWAL COMPLETE!");
    console.log("   TX:", result.tx);
    console.log("   ✅ ZK proof verified on-chain");
    console.log("   ✅ Funds sent to recipient");

    return {
      txSignature: result.tx,
      success: true,
    };
  } catch (error) {
    console.error("\n❌ WITHDRAWAL FAILED:", error);
    throw error;
  }
}

/**
 * Withdraw USDC using Privacy Cash SDK
 */
export async function withdrawUSDC({
  amountBaseUnits,
  recipientAddress,
  privacyCash,
  referrer,
}: {
  amountBaseUnits: number;
  recipientAddress: string;
  privacyCash: PrivacyCash;
  referrer?: string;
}): Promise<WithdrawResult> {
  console.log("💸 Starting Privacy Cash USDC withdrawal (SDK)...");
  console.log("   Amount:", amountBaseUnits / 1000000, "USDC");

  try {
    const result = await privacyCash.withdrawUSDC({
      base_units: amountBaseUnits,
      recipientAddress,
      referrer,
    });

    return {
      txSignature: result.tx,
      success: true,
    };
  } catch (error) {
    console.error("\n❌ USDC WITHDRAWAL FAILED:", error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BALANCE & UTXO MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get private balance from Privacy Cash SDK
 * SDK automatically syncs and decrypts UTXOs
 */
export async function getPrivateBalance(
  privacyCash: PrivacyCash
): Promise<{ sol: number; usdc: number }> {
  console.log("📊 Fetching private balance from Privacy Cash...");
  
  try {
    const balance = await privacyCash.getPrivateBalance();
    
    // SDK returns { lamports: number } for SOL
    // Convert to SOL and add USDC (default to 0)
    const solBalance = balance.lamports / LAMPORTS_PER_SOL;
    const usdcBalance = 0; // SDK doesn't return USDC yet
    
    console.log("✅ Private balance:");
    console.log("   SOL:", solBalance);
    console.log("   USDC:", usdcBalance);
    
    return {
      sol: solBalance,
      usdc: usdcBalance,
    };
  } catch (error) {
    console.error("❌ Failed to fetch balance:", error);
    throw error;
  }
}

/**
 * Clear UTXO cache
 * SDK automatically caches downloaded UTXOs for performance
 */
export async function clearUTXOCache(privacyCash: PrivacyCash): Promise<void> {
  console.log("🗑️  Clearing Privacy Cash UTXO cache...");
  
  await privacyCash.clearCache();
  
  console.log("✅ UTXO cache cleared");
}

/**
 * Clear all stored UTXOs (for testing only)
 */
export function clearAllStoredData(): void {
  window.localStorage.removeItem('privacycash_utxos');
  window.localStorage.removeItem('privacycash_cache');
  console.log("✅ Cleared all Privacy Cash data");
}
export { depositSOL as depositWithSignature } from './privacyCashDeposit';
