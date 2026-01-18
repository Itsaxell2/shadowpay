import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

/* ───────── GLOBAL ERROR SAFETY ───────── */

process.on("unhandledRejection", (reason) => {
  console.error("💥 UNHANDLED REJECTION:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("💥 UNCAUGHT EXCEPTION:", error);
});

/* ───────── ENV INIT ───────── */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

/* ───────── IMPORTS ───────── */

import {
  verifySignature,
  generateToken,
  authMiddleware
} from "./auth.js";

import {
  getCorsOptions,
  globalLimiter,
  paymentLimiter,
  withdrawalLimiter,
  sanitizeInput,
  securityLogger,
  validateJwtSecret,
  validatePrivateKey
} from "./security.js";

import {
  loadLinksFromSupabase,
  saveLinksToSupabase,
  initSupabase
} from "./supabase.js";

import privacyRoutes from "./routes/privacy.js";

/* ───────── CONSTANTS ───────── */

const PORT = process.env.PORT || 3333;
const RELAYER_URL = process.env.RELAYER_URL;
const RELAYER_TIMEOUT = Number(process.env.RELAYER_TIMEOUT || 30000);
const LINKS_FILE = path.resolve(__dirname, "links.json");

/* ───────── PRE-FLIGHT VALIDATION ───────── */

validateJwtSecret();
validatePrivateKey();
initSupabase();

if (process.env.NODE_ENV === "production" && !RELAYER_URL) {
  console.error("❌ RELAYER_URL REQUIRED IN PRODUCTION");
  process.exit(1);
}

/* ───────── APP INIT ───────── */

const app = express();
app.set("trust proxy", 1);

app.use(cors(getCorsOptions?.() ?? { origin: true }));
app.use(express.json({ limit: "1mb" }));
app.use(globalLimiter);
app.use(securityLogger);

/**
 * ⚠️ CRITICAL FIX:
 * sanitizeInput must NOT break base64 tx
 */
app.use((req, res, next) => {
  if (req.body?.transferTx || req.body?.signedTx) {
    return next();
  }
  sanitizeInput(req, res, next);
});

/* ───────── ROUTES ───────── */

app.use("/api/privacy", privacyRoutes);

/* ───────── HELPERS ───────── */

async function loadLinks() {
  try {
    const links = await loadLinksFromSupabase();
    if (Object.keys(links).length) return links;
    return JSON.parse(await fs.readFile(LINKS_FILE, "utf8"));
  } catch {
    return {};
  }
}

async function saveLinks(map) {
  await saveLinksToSupabase(map);
  await fs.writeFile(LINKS_FILE, JSON.stringify(map, null, 2));
}

/* ───────── HEALTH ───────── */

app.get("/health", (_, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    relayer: !!RELAYER_URL,
  });
});

/* ───────── AUTH ───────── */

app.post("/auth/login", async (req, res) => {
  const { publicKey, message, signature } = req.body;
  if (!verifySignature(message, signature, publicKey)) {
    return res.status(401).json({ error: "Invalid signature" });
  }
  res.json({ success: true, token: generateToken(publicKey) });
});

/* ───────── PAY ───────── */

app.post("/links/:id/pay", paymentLimiter, async (req, res) => {
  const { transferTx, lamports, payerPublicKey } = req.body;
  const map = await loadLinks();
  const link = map[req.params.id];

  if (!link) return res.status(404).json({ error: "Link not found" });
  if (link.status === "paid") return res.status(400).json({ error: "Already paid" });

  if (!transferTx || !payerPublicKey || !lamports) {
    return res.status(400).json({ error: "Missing payment fields" });
  }

  const expected = Math.floor(Number(link.amount) * LAMPORTS_PER_SOL);
  if (Number(lamports) !== expected) {
    return res.status(400).json({ error: "Amount mismatch" });
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), RELAYER_TIMEOUT);

  try {
    const r = await fetch(`${RELAYER_URL}/deposit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lamports,
        payerPublicKey,
        linkId: link.id,
      }),
      signal: controller.signal,
    });

    if (!r.ok) throw new Error(await r.text());
    const result = await r.json();

    link.status = "paid";
    link.commitment = result.commitment;
    link.txHash = result.tx;
    link.updated_at = Date.now();

    map[link.id] = link;
    await saveLinks(map);

    res.json({ success: true, tx: result.tx });
  } catch (e) {
    res.status(500).json({ error: "Relayer deposit failed" });
  }
});

/* ───────── CLAIM ───────── */

app.post("/links/:id/claim", withdrawalLimiter, authMiddleware, async (req, res) => {
  const { recipientWallet } = req.body;
  const map = await loadLinks();
  const link = map[req.params.id];

  if (!link || link.status !== "paid") {
    return res.status(400).json({ error: "Not withdrawable" });
  }

  try {
    new PublicKey(recipientWallet);
  } catch {
    return res.status(400).json({ error: "Invalid wallet" });
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), RELAYER_TIMEOUT);

  try {
    const r = await fetch(`${RELAYER_URL}/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commitment: link.commitment,
        recipient: recipientWallet,
        lamports: Math.floor(link.amount * LAMPORTS_PER_SOL),
      }),
      signal: controller.signal,
    });

    if (!r.ok) throw new Error(await r.text());
    const result = await r.json();

    link.status = "withdrawn";
    link.withdraw_tx = result.tx;
    link.withdrawn_at = Date.now();

    map[link.id] = link;
    await saveLinks(map);

    res.json({ success: true, tx: result.tx });
  } catch {
    res.status(500).json({ error: "Withdrawal failed" });
  }
});

/* ───────── START ───────── */

app.listen(PORT, () => {
  console.log(`🚀 Backend running on :${PORT}`);
  console.log(`🔁 Relayer: ${RELAYER_URL}`);
});
