import { useState, useEffect } from "react";
import { walletLogin, logout, getToken, getWallet } from "@/lib/auth";

interface WalletState {
  connected: boolean;
  publicKey: string | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    connected: false,
    publicKey: null,
    token: null,
    loading: false,
    error: null,
  });

  // Check if already authenticated on mount
  useEffect(() => {
    const token = getToken();
    const wallet = getWallet();
    if (token && wallet) {
      setState({
        connected: true,
        publicKey: wallet,
        token,
        loading: false,
        error: null,
      });
    }
  }, []);

  const connect = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // Check if Phantom is installed
      const phantom = (window as any).phantom?.solana;
      if (!phantom) {
        throw new Error("Phantom wallet not found. Please install Phantom extension.");
      }

      // Request connection
      const resp = await phantom.connect();
      const publicKey = resp.publicKey?.toString();
      if (!publicKey) {
        throw new Error("Failed to get public key from Phantom");
      }

      console.log("✅ Wallet connected:", publicKey.slice(0, 8) + "...");

      // ========================================================================
      // WALLET CONNECTED — SET STATE FIRST (DEMO/HACKATHON MODE)
      // ========================================================================
      // This ensures wallet shows as "connected" even if backend is offline.
      // Perfect for demos, testnet, or when backend auth is not critical.
      
      setState({
        connected: true,
        publicKey,
        token: null, // Will be populated if backend auth succeeds
        loading: false,
        error: null,
      });

      // Store wallet (no token yet)
      localStorage.setItem("shadowpay_wallet", publicKey);

      // ========================================================================
      // OPTIONAL BACKEND AUTH (GRACEFUL FAIL)
      // ========================================================================
      // Try to authenticate with backend, but DON'T fail wallet connection if it's down.
      // Backend auth is only needed for protected endpoints (withdrawal).
      
      try {
        console.log("🔐 Attempting backend authentication...");

        // Create message to sign
        const message = `Sign this message to authenticate with ShadowPay\nTimestamp: ${Date.now()}`;
        const messageBytes = new TextEncoder().encode(message);

        // Request signature
        const signResult = await phantom.signMessage(messageBytes);
        
        if (!signResult || !signResult.signature) {
          throw new Error("Failed to get signature from Phantom");
        }

        // Convert signature to base64
        let signatureBase64: string;
        if (signResult.signature instanceof Uint8Array) {
          signatureBase64 = btoa(String.fromCharCode(...signResult.signature));
        } else if (typeof signResult.signature === 'string') {
          signatureBase64 = signResult.signature;
        } else {
          throw new Error("Invalid signature format");
        }

        // Authenticate with backend
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const endpoint = apiUrl ? `${apiUrl}/auth/login` : '/api/auth/login';
        
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicKey,
            message,
            signature: signatureBase64,
          }),
        });

        if (!res.ok) {
          throw new Error(`Backend auth failed: ${res.status}`);
        }

        const data = await res.json();
        
        if (!data.token) {
          throw new Error("No token received from backend");
        }

        // Store token
        localStorage.setItem("shadowpay_token", data.token);

        // Update state with token
        setState(prev => ({
          ...prev,
          token: data.token,
        }));

        console.log("✅ Backend authentication successful!");
      } catch (authErr) {
        // Backend auth failed, but wallet is still connected
        const authMessage = authErr instanceof Error ? authErr.message : "Backend auth failed";
        console.warn("⚠️ Backend auth skipped:", authMessage);
        console.warn("📝 Wallet is connected, but protected endpoints (withdrawal) may not work.");
        console.warn("💡 Start backend server: cd server && npm run dev");
        
        // Don't set error state — wallet is still usable for many features
      }

    } catch (err) {
      // Critical wallet connection error (Phantom not found, connection rejected, etc.)
      const message = err instanceof Error ? err.message : "Connection failed";
      console.error("❌ Wallet connection failed:", message);
      setState({
        connected: false,
        publicKey: null,
        token: null,
        loading: false,
        error: message,
      });
    }
  };

  const disconnect = () => {
    logout();
    setState({
      connected: false,
      publicKey: null,
      token: null,
      loading: false,
      error: null,
    });
  };

  return {
    ...state,
    connect,
    disconnect,
  };
}
