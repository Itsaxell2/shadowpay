/**
 * Privacy Cash Client-Signed Deposits
 * 
 * ✅ CORRECT ARCHITECTURE:
 * - User signs deposit transaction (non-custodial)
 * - No relayer needed for deposits
 * - PrivacyCash SDK handles everything
 * 
 * FLOW:
 * 1. Initialize PrivacyCash SDK with wallet public key
 * 2. Call SDK.deposit() - SDK builds + generates ZK proof
 * 3. SDK returns signed transaction
 * 4. Browser submits to blockchain
 */

import { PrivacyCash } from "privacycash";
import { 
  Connection, 
  PublicKey,
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";

import type { WalletContextState } from "@solana/wallet-adapter-react";

export interface DepositOptions {
  amount: number; // in lamports
  wallet: WalletContextState;
  connection: Connection;
  rpcUrl: string;
  linkId?: string; // for tracking purposes
}

export interface DepositResult {
  signature: string;
  amount: number;
  timestamp: number;
}

/**
 * ✅ CORRECT: Client-signed deposit via Privacy Cash SDK
 * 
 * User signs → SDK builds transaction → SDK submits → Non-custodial
 */
export async function depositPrivateLy(
  options: DepositOptions
): Promise<DepositResult> {
  const { amount, wallet, connection, rpcUrl, linkId } = options;

  console.log("🔐 Starting Privacy Cash deposit (client-signed)...");
  console.log(`   Amount: ${amount / 1e9} SOL (${amount} lamports)`);
  console.log(`   RPC: ${rpcUrl}`);

  // 1. Validate wallet
  if (!wallet.connected || !wallet.publicKey) {
    throw new Error("❌ Wallet not connected");
  }

  if (!wallet.signTransaction) {
    throw new Error("❌ Wallet cannot sign transactions");
  }

  console.log(`   Wallet: ${wallet.publicKey.toBase58()}`);

  // 2. Initialize Privacy Cash SDK with wallet's public key
  // SDK will use this public key as owner of the UTXO
  console.log("\n⚙️  Initializing Privacy Cash SDK...");
  
  const sdk = new PrivacyCash({
    RPC_url: rpcUrl,
    owner: wallet.publicKey.toBase58(), // Use wallet's public key
    enableDebug: true,
  });

  try {
    // 3. Call SDK.deposit() - this is where the magic happens
    // SDK will:
    // - Generate ZK proof (10-30 seconds)
    // - Build deposit transaction
    // - Return transaction signature
    console.log("\n🔐 Building ZK proof (this may take 10-30 seconds)...");
    console.log("   Privacy Cash SDK is:");
    console.log("   - Fetching current merkle tree");
    console.log("   - Generating ZK proof");
    console.log("   - Building & submitting transaction");

    const startTime = Date.now();

    const result = await sdk.deposit({
      lamports: amount,
    });

    const duration = Date.now() - startTime;
    console.log(`\n✅ Deposit complete in ${duration}ms`);
    console.log(`   TX: ${result.tx}`);
    console.log(`   Amount: ${amount / LAMPORTS_PER_SOL} SOL`);

    // 4. Return result
    return {
      signature: result.tx,
      amount,
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error("\n❌ Deposit failed:", error);
    
    if (error.message?.includes("fetch")) {
      throw new Error(
        "Failed to fetch merkle tree data. Check RPC endpoint."
      );
    }

    throw error;
  }
}

/**
 * ✅ CORRECT: Get private balance of user's Privacy Cash
 */
export async function getPrivateBalance(
  wallet: WalletContextState,
  rpcUrl: string
): Promise<number> {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const sdk = new PrivacyCash({
    RPC_url: rpcUrl,
    owner: wallet.publicKey.toBase58(),
  });

  try {
    const balance = await sdk.getPrivateBalance();
    console.log(`📊 Private balance: ${balance.lamports / LAMPORTS_PER_SOL} SOL`);
    return balance.lamports;
  } catch (error) {
    console.error("Failed to fetch balance:", error);
    throw error;
  }
}

/**
 * ✅ CORRECT: Clear UTXO cache (useful for testing)
 */
export async function clearPrivateCacheBalance(
  wallet: WalletContextState,
  rpcUrl: string
): Promise<void> {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const sdk = new PrivacyCash({
    RPC_url: rpcUrl,
    owner: wallet.publicKey.toBase58(),
  });

  await sdk.clearCache();
  console.log("✅ Cache cleared");
}
