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

      // Create message to sign
      const message = `Sign this message to authenticate with ShadowPay\nTimestamp: ${Date.now()}`;
      const messageBytes = new TextEncoder().encode(message);

      // Request signature
      console.log("Requesting signature from Phantom...");
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

      console.log("Signature obtained, authenticating with backend...");

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
        const errorText = await res.text();
        throw new Error(`Authentication failed: ${errorText}`);
      }

      const data = await res.json();
      
      if (!data.token) {
        throw new Error("No token received from backend");
      }

      // Store token and wallet
      localStorage.setItem("shadowpay_token", data.token);
      localStorage.setItem("shadowpay_wallet", publicKey);

      console.log("Authentication successful!");

      setState({
        connected: true,
        publicKey,
        token: data.token,
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      console.error("Wallet connection error:", message);
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
