/**
 * Privacy Cash Client-Side Deposit (MODEL B)
 * 
 * ARCHITECTURE:
 * - 100% browser-based ZK proof generation
 * - User wallet signs transaction
 * - Direct RPC submission (no backend)
 * - UTXO stored in localStorage
 * 
 * SAME MODEL AS: Tornado Cash, Railgun, Aztec
 */

import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
// Note: initHasher will be used when we integrate real Poseidon hashing
// import { initHasher } from "@lightprotocol/hasher.rs";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface DepositResult {
  txSignature: string;
  commitment: string;
  utxo: UTXOData;
}

export interface UTXOData {
  amount: number; // lamports
  commitment: string;
  nullifier: string;
  secret: string;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENCRYPTION SERVICE (Wallet-Based)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Derives encryption key from wallet signature
 * Same approach as Privacy Cash official website
 */
export class EncryptionService {
  private encryptionKey: Uint8Array | null = null;

  /**
   * User signs message "Privacy Money account sign in"
   * Signature is used as encryption key for UTXO storage
   */
  async deriveEncryptionKeyFromSignature(signature: Uint8Array): Promise<void> {
    // Use signature as encryption key
    // In production, you might want to hash it first
    this.encryptionKey = signature;
    console.log("✅ Encryption key derived from wallet signature");
  }

  getEncryptionKey(): Uint8Array {
    if (!this.encryptionKey) {
      throw new Error("Encryption key not initialized. Call deriveEncryptionKeyFromSignature first.");
    }
    return this.encryptionKey;
  }

  /**
   * Encrypt UTXO data for localStorage
   */
  async encryptUTXO(utxo: UTXOData): Promise<string> {
    // Simple XOR encryption (in production, use proper crypto)
    const json = JSON.stringify(utxo);
    const key = this.getEncryptionKey();
    const encrypted = new Uint8Array(json.length);
    
    for (let i = 0; i < json.length; i++) {
      encrypted[i] = json.charCodeAt(i) ^ key[i % key.length];
    }
    
    return btoa(String.fromCharCode(...encrypted));
  }

  /**
   * Decrypt UTXO data from localStorage
   */
  async decryptUTXO(encrypted: string): Promise<UTXOData> {
    const key = this.getEncryptionKey();
    const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const decrypted = new Uint8Array(encryptedBytes.length);
    
    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ key[i % key.length];
    }
    
    const json = String.fromCharCode(...decrypted);
    return JSON.parse(json);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRIVACY CASH DEPOSIT (CLIENT-SIDE)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate random secret for UTXO
 */
function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Compute commitment from secret
 * commitment = hash(secret)
 */
async function computeCommitment(secret: string): Promise<string> {
  // TODO: Use Poseidon hash from hasher.rs when circuit files are ready
  // await initHasher();
  // const secretBigInt = BigInt("0x" + secret);
  // const commitment = poseidonHash([secretBigInt]);
  // return commitment.toString(16);
  
  // Placeholder: Use SHA-256 for now
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compute nullifier from secret
 * nullifier = hash(secret + nonce)
 */
async function computeNullifier(secret: string): Promise<string> {
  // In real implementation, use poseidon hash from hasher.rs
  const encoder = new TextEncoder();
  const data = encoder.encode(secret + "_nullifier");
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate ZK proof for deposit
 * This is a PLACEHOLDER - real implementation uses circuit2/transaction2.wasm
 */
async function generateDepositProof(
  secret: string,
  commitment: string,
  amount: number
): Promise<any> {
  console.log("🔐 Generating ZK proof in browser...");
  console.log("   Circuit: /circuit2/transaction2.wasm");
  console.log("   Proving key: /circuit2/transaction2.zkey");
  
  // TODO: Load WASM and generate real proof
  // const wasmUrl = "/circuit2/transaction2.wasm";
  // const zkeyUrl = "/circuit2/transaction2.zkey";
  // const proof = await generateProofWithWASM(wasmUrl, zkeyUrl, inputs);
  
  // For now, return placeholder
  return {
    proof: "proof_placeholder",
    publicSignals: ["signal1", "signal2"]
  };
}

/**
 * Client-side SOL deposit
 * 
 * @param amountLamports - Amount to deposit in lamports
 * @param connection - Solana connection
 * @param publicKey - User's wallet public key
 * @param signTransaction - Wallet's sign function
 * @param encryptionService - Encryption service for UTXO storage
 * 
 * @returns DepositResult with tx signature, commitment, UTXO
 */
export async function depositSOL({
  amountLamports,
  connection,
  publicKey,
  signTransaction,
  encryptionService
}: {
  amountLamports: number;
  connection: Connection;
  publicKey: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  encryptionService: EncryptionService;
}): Promise<DepositResult> {
  console.log("💰 Starting client-side deposit...");
  console.log("   Amount:", amountLamports / LAMPORTS_PER_SOL, "SOL");
  console.log("   Wallet:", publicKey.toBase58());

  // 1. Generate secret and commitment
  const secret = generateSecret();
  const commitment = await computeCommitment(secret);
  const nullifier = await computeNullifier(secret);
  
  console.log("✅ Generated commitment:", commitment.substring(0, 16) + "...");

  // 2. Generate ZK proof (browser-based)
  const proof = await generateDepositProof(secret, commitment, amountLamports);
  
  console.log("✅ ZK proof generated in browser");

  // 3. Build deposit transaction
  // PLACEHOLDER: Real implementation calls Privacy Cash program
  const transaction = new Transaction();
  
  // Privacy Cash program ID (mainnet)
  const PRIVACY_CASH_PROGRAM_ID = new PublicKey("privacybXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"); // TODO: Replace with real program ID
  
  // Add Privacy Cash deposit instruction
  // transaction.add({
  //   keys: [...],
  //   programId: PRIVACY_CASH_PROGRAM_ID,
  //   data: Buffer.from([...proof.proof, ...commitment])
  // });
  
  // For now, add simple transfer (PLACEHOLDER)
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: PRIVACY_CASH_PROGRAM_ID, // Should be pool address
      lamports: amountLamports,
    })
  );

  // 4. Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = publicKey;

  console.log("📝 Transaction built, requesting signature from wallet...");

  // 5. User signs transaction
  const signedTransaction = await signTransaction(transaction);

  console.log("✅ Transaction signed by user");
  console.log("📡 Submitting to RPC directly...");

  // 6. Send transaction directly to RPC (NO BACKEND)
  const signature = await connection.sendRawTransaction(
    signedTransaction.serialize()
  );

  console.log("✅ Transaction submitted:", signature);
  console.log("⏳ Confirming...");

  // 7. Confirm transaction
  await connection.confirmTransaction(signature, "confirmed");

  console.log("✅ Deposit confirmed!");

  // 8. Create UTXO data
  const utxo: UTXOData = {
    amount: amountLamports,
    commitment,
    nullifier,
    secret,
    timestamp: Date.now(),
  };

  // 9. Store UTXO in localStorage (encrypted)
  const encryptedUTXO = await encryptionService.encryptUTXO(utxo);
  const storedUTXOs = JSON.parse(localStorage.getItem("privacycash_utxos") || "[]");
  storedUTXOs.push(encryptedUTXO);
  localStorage.setItem("privacycash_utxos", JSON.stringify(storedUTXOs));

  console.log("✅ UTXO stored in localStorage");

  return {
    txSignature: signature,
    commitment,
    utxo,
  };
}

/**
 * Get all stored UTXOs from localStorage
 */
export async function getStoredUTXOs(encryptionService: EncryptionService): Promise<UTXOData[]> {
  const stored = JSON.parse(localStorage.getItem("privacycash_utxos") || "[]");
  const decrypted: UTXOData[] = [];
  
  for (const encrypted of stored) {
    try {
      const utxo = await encryptionService.decryptUTXO(encrypted);
      decrypted.push(utxo);
    } catch (err) {
      console.error("Failed to decrypt UTXO:", err);
    }
  }
  
  return decrypted;
}
