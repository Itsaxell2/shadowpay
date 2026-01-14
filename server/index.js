import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";
import { PublicKey } from "@solana/web3.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

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

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LINKS_FILE = path.resolve(__dirname, "links.json");

const PORT = process.env.PORT || 3333;
const RELAYER_URL = process.env.RELAYER_URL;

/* ───────────────────────── INIT ───────────────────────── */

validateJwtSecret();
validatePrivateKey();
initSupabase();

const app = express();
app.set("trust proxy", 1);

app.use(cors(getCorsOptions()));
app.use(express.json({ limit: "1mb" }));
app.use(globalLimiter);
app.use(securityLogger);
app.use(sanitizeInput);

/* ─────────────────────── HELPERS ─────────────────────── */

async function loadLinks() {
  try {
    const links = await loadLinksFromSupabase();
    if (Object.keys(links).length > 0) return links;
    const data = await fs.readFile(LINKS_FILE, "utf8");
    return JSON.parse(data || "{}");
  } catch {
    return {};
  }
}

async function saveLinks(map) {
  await saveLinksToSupabase(map);
  await fs.writeFile(LINKS_FILE, JSON.stringify(map, null, 2));
}

/* ─────────────────────── HEALTH ─────────────────────── */

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

/* ───────────────────── AUTH ───────────────────── */

app.post("/auth/login", async (req, res) => {
  const { publicKey, message, signature } = req.body;

  if (!verifySignature(message, signature, publicKey)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const token = generateToken(publicKey, { address: publicKey });
  return res.json({ success: true, token });
});

/* ───────────────────── LINKS ───────────────────── */

app.post("/links", async (req, res) => {
  const { amount, token, creator_id } = req.body;

  if (!amount || !creator_id) {
    return res.status(400).json({ error: "amount & creator_id required" });
  }

  const map = await loadLinks();
  const id = Math.random().toString(36).slice(2, 9);

  const link = {
    id,
    creator_id,
    amount,
    token: token || "SOL",
    status: "created",
    commitment: null,
    payment_count: 0,
    created_at: Date.now()
  };

  map[id] = link;
  await saveLinks(map);

  res.json({
    success: true,
    link,
    url: `${process.env.FRONTEND_ORIGIN}/pay/${id}`
  });
});

app.get("/links/:id", async (req, res) => {
  const map = await loadLinks();
  const link = map[req.params.id];
  if (!link) return res.status(404).json({ error: "not found" });
  res.json({ success: true, link });
});

/* ───────────────────── PAY (DEPOSIT) ───────────────────── */

app.post("/links/:id/pay", paymentLimiter, async (req, res) => {
  if (!RELAYER_URL) {
    return res.status(500).json({ error: "RELAYER_URL not set" });
  }

  const { amount, token } = req.body;
  const map = await loadLinks();
  const link = map[req.params.id];

  if (!link) return res.status(404).json({ error: "Link not found" });
  if (link.status === "paid") {
    return res.status(400).json({ error: "Already paid" });
  }

  const relayerRes = await fetch(`${RELAYER_URL}/deposit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount,
      token,
      linkId: link.id
    })
  });

  const result = await relayerRes.json();

  if (!result.commitment) {
    return res.status(500).json({ error: "Relayer deposit failed" });
  }

  link.status = "paid";
  link.commitment = result.commitment;
  link.txHash = result.tx;
  link.payment_count += 1;
  link.paid_at = Date.now();

  map[link.id] = link;
  await saveLinks(map);

  res.json({ success: true, link });
});

/* ───────────────────── CLAIM (WITHDRAW) ───────────────────── */

app.post(
  "/links/:id/claim",
  withdrawalLimiter,
  authMiddleware,
  async (req, res) => {
    const { recipientWallet } = req.body;
    const map = await loadLinks();
    const link = map[req.params.id];

    if (!link) return res.status(404).json({ error: "Link not found" });
    if (link.status !== "paid") {
      return res.status(400).json({ error: "Not withdrawable" });
    }

    try {
      new PublicKey(recipientWallet);
    } catch {
      return res.status(400).json({ error: "Invalid wallet" });
    }

    const relayerRes = await fetch(`${RELAYER_URL}/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commitment: link.commitment,
        recipient: recipientWallet
      })
    });

    const result = await relayerRes.json();

    if (!result.tx) {
      return res.status(500).json({ error: "Withdraw failed" });
    }

    link.status = "withdrawn";
    link.withdraw_tx = result.tx;
    link.withdrawn_at = Date.now();

    map[link.id] = link;
    await saveLinks(map);

    res.json({ success: true, tx: result.tx });
  }
);

/* ───────────────────── DASHBOARD ───────────────────── */

app.get("/api/payment-links", async (req, res) => {
  const user = req.query.user_id;
  if (!user) return res.json({ links: [] });

  const map = await loadLinks();
  const links = Object.values(map).filter(
    (l) => l.creator_id === user
  );

  res.json({ success: true, links });
});

/* ───────────────────── START ───────────────────── */

app.listen(PORT, () => {
  console.log(`🚀 Backend running on :${PORT}`);
  console.log(`🔁 Using relayer: ${RELAYER_URL}`);
});
