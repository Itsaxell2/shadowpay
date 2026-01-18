import { createRoot } from "react-dom/client";
import React from "react";
import "./index.css";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

async function mount() {
  const rootEl = document.getElementById("root");
  if (!rootEl) {
    console.error("Root element not found");
    return;
  }

  try {
    const { default: App } = await import("./App.tsx");

    // ===== Solana setup =====
    const network = WalletAdapterNetwork.Devnet;

    const endpoint =
      import.meta.env.VITE_SOLANA_RPC ||
      clusterApiUrl(network);

    const wallets = [
      new PhantomWalletAdapter(),
    ];

    createRoot(rootEl).render(
      <React.StrictMode>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <App />
          </WalletProvider>
        </ConnectionProvider>
      </React.StrictMode>
    );
  } catch (err) {
    console.error("Failed to load app:", err);
    rootEl.innerHTML = `
      <div style="padding:24px;font-family:Inter,system-ui,sans-serif;color:#111">
        <h2 style="color:#b91c1c">Application failed to load</h2>
        <pre style="white-space:pre-wrap;color:#111">${String(err)}</pre>
      </div>
    `;
  }
}

mount();
