import express from "express"
import { Connection, Transaction } from "@solana/web3.js"
import { PrivacyCash } from "privacy-cash-sdk"

const router = express.Router()

// ===== SOLANA CONNECTION =====
const connection = new Connection(
  process.env.SOLANA_RPC || "https://api.devnet.solana.com",
  "confirmed"
)

// ===== PRIVACY CASH INIT (NODE ONLY) =====
const privacyCash = new PrivacyCash({
  network: process.env.SOLANA_NETWORK || "devnet",
  relayerKeypair: JSON.parse(process.env.RELAYER_KEYPAIR),
})

// ===== INITIATE PAYMENT =====
router.post("/initiate", async (req, res) => {
  try {
    const { amount, linkId, payer } = req.body

    if (!amount || !linkId || !payer) {
      return res.status(400).json({
        success: false,
        error: "Missing parameters",
      })
    }

    const tx = await privacyCash.buildDepositTx({
      amount: Number(amount),
      payer,
      memo: `shadowpay:${linkId}`,
    })

    const serializedTx = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    })

    res.json({
      success: true,
      serializedTx: serializedTx.toString("base64"),
    })
  } catch (err) {
    console.error("[PAYMENT INIT ERROR]", err)
    res.status(500).json({
      success: false,
      error: err.message || "Internal error",
    })
  }
})

// ===== SUBMIT SIGNED TX =====
router.post("/submit", async (req, res) => {
  try {
    const { signedTx } = req.body

    if (!signedTx) {
      return res.status(400).json({
        success: false,
        error: "Missing signed transaction",
      })
    }

    const tx = Transaction.from(Buffer.from(signedTx, "base64"))

    const signature = await connection.sendRawTransaction(
      tx.serialize(),
      { skipPreflight: false }
    )

    await connection.confirmTransaction(signature, "confirmed")

    res.json({
      success: true,
      signature,
    })
  } catch (err) {
    console.error("[PAYMENT SUBMIT ERROR]", err)
    res.status(500).json({
      success: false,
      error: err.message || "Transaction failed",
    })
  }
})

export default router
