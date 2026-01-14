import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import { PrivacyCash } from "privacycash";
import { Keypair } from "@solana/web3.js";

dotenv.config();

const app = express();
app.use(express.json());

/* ─────────────────────────────────────
   Load relayer keypair
───────────────────────────────────── */
const keypairPath = process.env.RELAYER_KEYPAIR_PATH;
if (!keypairPath) {
  throw new Error("RELAYER_KEYPAIR_PATH not set");
}

const secret = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
const relayerKeypair = Keypair.fromSecretKey(Uint8Array.from(secret));

console.log("🧾 Relayer address:", relayerKeypair.publicKey.toBase58());

/* ─────────────────────────────────────
   Init Privacy Cash client
───────────────────────────────────── */
const client = new PrivacyCash({
  RPC_url: process.env.RPC_URL,
  owner: relayerKeypair
});

/* ─────────────────────────────────────
   Health check
───────────────────────────────────── */
app.get("/health", (_, res) => {
  res.json({ ok: true, relayer: relayerKeypair.publicKey.toBase58() });
});

/* ─────────────────────────────────────
   DEPOSIT — called by backend only
───────────────────────────────────── */
app.post("/deposit", async (req, res) => {
  try {
    const { lamports } = req.body;

    if (!lamports || lamports <= 0) {
      return res.status(400).json({ error: "lamports required" });
    }

    const result = await client.deposit({
      lamports: BigInt(lamports)
    });

    return res.json({
      success: true,
      commitment: "0xPRIVACY_CASH_COMMITMENT_PLACEHOLDER",
      tx: "PRIVACY_CASH_TX_PLACEHOLDER"
    });
  } catch (err) {
    console.error("❌ deposit error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────
   WITHDRAW — called by backend only
───────────────────────────────────── */
app.post("/withdraw", async (req, res) => {
  try {
    const { commitment, recipient, lamports } = req.body;

    if (!commitment || !recipient || !lamports) {
      return res.status(400).json({ error: "missing fields" });
    }

    const result = await client.withdraw({
      commitment,
      recipient,
      lamports: BigInt(lamports)
    });

    return res.json({
      success: true,
      tx: result.tx
    });
  } catch (err) {
    console.error("❌ withdraw error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────
   PRIVATE BALANCE (pool)
───────────────────────────────────── */
app.get("/balance", async (_, res) => {
  try {
    const balance = await client.getBalance();
    res.json({ success: true, balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────
   Start
───────────────────────────────────── */
const PORT = process.env.PORT || 4444;
app.listen(PORT, () => {
  console.log(`🚀 Relayer running on port ${PORT}`);
});
