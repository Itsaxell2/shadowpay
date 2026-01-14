import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

// ⬇️ IMPORT DATA BUILDER (INI PENTING)
import {
  buildDepositData,
  buildWithdrawData,
} from "./privacycash-builders.js";

dotenv.config();

/* ─────────────────────────────────────
   BASIC SETUP
───────────────────────────────────── */
const app = express();
app.use(express.json());

/* ─────────────────────────────────────
   ENV
───────────────────────────────────── */
const RPC_URL = process.env.SOLANA_RPC_URL;
const PROGRAM_ID = process.env.PRIVACYCASH_PROGRAM_ID;
const RELAYER_KEYPAIR_PATH = process.env.RELAYER_KEYPAIR_PATH;

if (!RPC_URL || !PROGRAM_ID || !RELAYER_KEYPAIR_PATH) {
  throw new Error("Missing required env");
}

/* ─────────────────────────────────────
   SOLANA CONNECTION
───────────────────────────────────── */
const connection = new Connection(RPC_URL, "confirmed");

/* ─────────────────────────────────────
   RELAYER KEYPAIR
───────────────────────────────────── */
const secret = JSON.parse(
  fs.readFileSync(RELAYER_KEYPAIR_PATH, "utf8")
);

const relayerKeypair = Keypair.fromSecretKey(
  Uint8Array.from(secret)
);

console.log("🧾 Relayer:", relayerKeypair.publicKey.toBase58());

/* ─────────────────────────────────────
   HEALTH
───────────────────────────────────── */
app.get("/health", (_, res) => {
  res.json({
    ok: true,
    relayer: relayerKeypair.publicKey.toBase58(),
  });
});

/* ─────────────────────────────────────
   DEPOSIT
───────────────────────────────────── */
app.post("/deposit", async (req, res) => {
  try {
    const {
      commitment,
      amount,
      assetType,
      poolAccount,
      merkleAccount,
    } = req.body;

    if (!commitment || !poolAccount || !merkleAccount) {
      return res.status(400).json({ error: "missing fields" });
    }

    // 1️⃣ Build instruction data
    const data = buildDepositData(
      commitment,
      amount || 0,
      assetType || 0
    );

    // 2️⃣ Instruction
    const ix = new TransactionInstruction({
      programId: new PublicKey(PROGRAM_ID),
      keys: [
        { pubkey: relayerKeypair.publicKey, isSigner: true, isWritable: false },
        { pubkey: new PublicKey(poolAccount), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(merkleAccount), isSigner: false, isWritable: true },
      ],
      data: Buffer.from(data),
    });

    // 3️⃣ Transaction
    const { blockhash } = await connection.getLatestBlockhash();
    const tx = new Transaction({
      feePayer: relayerKeypair.publicKey,
      recentBlockhash: blockhash,
    }).add(ix);

    tx.sign(relayerKeypair);

    // 4️⃣ Send
    const sig = await connection.sendRawTransaction(
      tx.serialize(),
      { maxRetries: 3 }
    );

    res.json({
      success: true,
      tx: sig,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────
   WITHDRAW
───────────────────────────────────── */
app.post("/withdraw", async (req, res) => {
  try {
    const {
      root,
      nullifier,
      recipient,
      amount,
      assetType,
      poolAccount,
      merkleAccount,
      nullifierAccount,
    } = req.body;

    if (!root || !nullifier || !recipient) {
      return res.status(400).json({ error: "missing fields" });
    }

    const data = buildWithdrawData(
      root,
      nullifier,
      amount || 0,
      assetType || 0
    );

    const ix = new TransactionInstruction({
      programId: new PublicKey(PROGRAM_ID),
      keys: [
        { pubkey: new PublicKey(poolAccount), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(merkleAccount), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(nullifierAccount), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(recipient), isSigner: false, isWritable: true },
      ],
      data: Buffer.from(data),
    });

    const { blockhash } = await connection.getLatestBlockhash();
    const tx = new Transaction({
      feePayer: relayerKeypair.publicKey,
      recentBlockhash: blockhash,
    }).add(ix);

    tx.sign(relayerKeypair);

    const sig = await connection.sendRawTransaction(
      tx.serialize(),
      { maxRetries: 3 }
    );

    res.json({
      success: true,
      tx: sig,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────
   START
───────────────────────────────────── */
const PORT = process.env.PORT || 4444;
app.listen(PORT, () => {
  console.log(`🚀 Relayer running on ${PORT}`);
});

