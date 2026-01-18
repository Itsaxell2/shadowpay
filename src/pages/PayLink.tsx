import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export default function PayLink() {
  const { id } = useParams<{ id: string }>();
  const { connection } = useConnection();
  const wallet = useWallet();

  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /* ───────────────── FETCH LINK ───────────────── */

  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/links/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.link) setLink(d.link);
        else setError("Payment link not found");
      })
      .catch(() => setError("Failed to load payment link"));
  }, [id]);

  /* ───────────────── PAY HANDLER ───────────────── */

  const handlePay = async () => {
    try {
      setError(null);

      if (!wallet.connected || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }

      if (!wallet.signTransaction) {
        throw new Error("Wallet cannot sign transaction");
      }

      if (!link) {
        throw new Error("Invalid payment link");
      }

      setLoading(true);

      /* ───── AMOUNT ───── */
      const lamports = Math.floor(
        Number(link.amount) * LAMPORTS_PER_SOL
      );

      /* ───── BUILD TRANSFER TX ───── */
      const transferTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(
            import.meta.env.VITE_RELAYER_WALLET
          ),
          lamports,
        })
      );

      transferTx.feePayer = wallet.publicKey;
      transferTx.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      /* ───── SIGN TX ───── */
      const signedTx = await wallet.signTransaction(transferTx);

      const serializedTx = signedTx
        .serialize()
        .toString("base64");

      /* ───── SEND TO BACKEND ───── */
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/links/${id}/pay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transferTx: serializedTx,
            lamports,
            payerPublicKey: wallet.publicKey.toBase58(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      setSuccess(true);
    } catch (e: any) {
      console.error("[PAY ERROR]", e);
      setError(e.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  /* ───────────────── UI ───────────────── */

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  if (!link) {
    return <div>Loading payment link...</div>;
  }

  if (success) {
    return (
      <div>
        <h2>✅ Payment Successful</h2>
        <p>Your payment has been sent privately.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h2>ShadowPay</h2>

      <p>
        Amount: <b>{link.amount} SOL</b>
      </p>

      <p>Status: {link.status}</p>

      <button
        onClick={handlePay}
        disabled={!wallet.connected || loading}
        style={{ width: "100%" }}
      >
        {loading ? "Processing..." : "Pay Privately"}
      </button>

      {!wallet.connected && (
        <p style={{ color: "orange" }}>
          Please connect your wallet
        </p>
      )}
    </div>
  );
}
