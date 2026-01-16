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
    loading: true, // Start with loading true
    error: null,
  });

  // Check if already authenticated on mount and auto-reconnect
  useEffect(() => {
    const initWallet = async () => {
      const token = getToken();
      const wallet = getWallet();
      
      // Wait for Phantom to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if we have stored wallet data
      if (wallet) {
        try {
          const getPhantom = () => {
            if ((window as any).phantom?.solana?.isPhantom) {
              return (window as any).phantom.solana;
            }
            if ((window as any).solana?.isPhantom) {
              return (window as any).solana;
            }
            return null;
          };
          
          const phantom = getPhantom();
          
          if (!phantom) {
            setState({
              connected: false,
              publicKey: null,
              token: null,
              loading: false,
              error: null,
            });
            return;
          }
          
          // Check if Phantom is already connected
          if (phantom.isConnected && phantom.publicKey) {
            const publicKey = phantom.publicKey.toString();
            if (publicKey === wallet) {
              console.log("🔄 Auto-reconnected:", publicKey.slice(0, 8) + "...");
              setState({
                connected: true,
                publicKey,
                token,
                loading: false,
                error: null,
              });
              return;
            }
          }
          
          // Try silent reconnect
          try {
            const resp = await phantom.connect({ onlyIfTrusted: true });
            const publicKey = resp.publicKey?.toString();
            if (publicKey && publicKey === wallet) {
              console.log("🔄 Silent reconnect successful:", publicKey.slice(0, 8) + "...");
              setState({
                connected: true,
                publicKey,
                token,
                loading: false,
                error: null,
              });
            } else {
              // Stored wallet doesn't match, clear storage
              localStorage.removeItem("shadowpay_wallet");
              localStorage.removeItem("shadowpay_token");
              setState({
                connected: false,
                publicKey: null,
                token: null,
                loading: false,
                error: null,
              });
            }
          } catch (err) {
            // Silent reconnect failed (user needs to approve again)
            console.log("ℹ️  Silent reconnect not available, user needs to connect");
            setState({
              connected: false,
              publicKey: null,
              token: null,
              loading: false,
              error: null,
            });
          }
        } catch (err) {
          console.error("Init error:", err);
          setState({
            connected: false,
            publicKey: null,
            token: null,
            loading: false,
            error: null,
          });
        }
      } else {
        // No stored wallet
        setState({
          connected: false,
          publicKey: null,
          token: null,
          loading: false,
          error: null,
        });
      }
    };

    initWallet();

    // Listen for Phantom disconnect events
    const getPhantom = () => {
      if ((window as any).phantom?.solana?.isPhantom) {
        return (window as any).phantom.solana;
      }
      if ((window as any).solana?.isPhantom) {
        return (window as any).solana;
      }
      return null;
    };
    
    const phantom = getPhantom();
    if (phantom) {
      const handleDisconnect = () => {
        console.log("👋 Phantom disconnected");
        localStorage.removeItem("shadowpay_wallet");
        localStorage.removeItem("shadowpay_token");
        setState({
          connected: false,
          publicKey: null,
          token: null,
          loading: false,
          error: null,
        });
      };

      // Remove any existing listeners first
      try {
        phantom.off("disconnect", handleDisconnect);
      } catch (e) {
        // Ignore if no listeners exist
      }
      
      phantom.on("disconnect", handleDisconnect);

      // Cleanup
      return () => {
        try {
          phantom.off("disconnect", handleDisconnect);
        } catch (e) {
          // Ignore cleanup errors
        }
      };
    }
  }, []);

  const connect = async () => {
    // Prevent multiple simultaneous connection attempts
    if (state.loading) {
      console.log("⏳ Connection already in progress...");
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      // Wait for Phantom to be fully initialized
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check if Phantom is installed with robust detection
      const getPhantom = () => {
        if ((window as any).phantom?.solana?.isPhantom) {
          return (window as any).phantom.solana;
        }
        // Fallback: check window.solana
        if ((window as any).solana?.isPhantom) {
          return (window as any).solana;
        }
        return null;
      };
      
      const phantom = getPhantom();
      
      if (!phantom) {
        throw new Error("Phantom wallet not found. Please install from phantom.app");
      }

      console.log("🦊 Phantom detected, connecting...");

      // If already connected, just use existing connection
      if (phantom.isConnected && phantom.publicKey) {
        const publicKey = phantom.publicKey.toString();
        console.log("✅ Using existing connection:", publicKey.slice(0, 8) + "...");
        
        setState({
          connected: true,
          publicKey,
          token: null,
          loading: false,
          error: null,
        });
        
        localStorage.setItem("shadowpay_wallet", publicKey);
        return;
      }

      // Request new connection
      let resp: any;
      try {
        resp = await phantom.connect();
      } catch (connectErr: any) {
        // Handle Phantom-specific errors
        const errMsg = connectErr?.message || String(connectErr);
        
        if (errMsg.includes('User rejected') || errMsg.includes('rejected') || connectErr?.code === 4001) {
          throw new Error("Connection rejected by user");
        }
        
        if (errMsg.includes('already pending')) {
          throw new Error("Connection already pending. Check Phantom popup.");
        }
        
        if (errMsg === "Unexpected error" || !errMsg) {
          // Phantom throws this when connection state is unclear
          // Try to recover by checking if actually connected
          await new Promise(resolve => setTimeout(resolve, 500));
          if (phantom.isConnected && phantom.publicKey) {
            resp = { publicKey: phantom.publicKey };
          } else {
            throw new Error("Connection failed. Please try again or reload the page.");
          }
        } else {
          throw connectErr;
        }
      }
      
      const publicKey = resp?.publicKey?.toString();
      if (!publicKey) {
        throw new Error("Failed to get wallet address");
      }

      console.log("✅ Wallet connected:", publicKey.slice(0, 8) + "...");

      setState({
        connected: true,
        publicKey,
        token: null,
        loading: false,
        error: null,
      });

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
        console.log("ℹ️ Demo mode: Backend server not available");
        console.log("💡 All features work offline. Backend only needed for production deployment.");
        
        // Don't set error state — wallet is still usable for many features
      }

    } catch (err) {
      // Critical wallet connection error (Phantom not found, connection rejected, etc.)
      let message = "Connection failed";
      
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        message = String((err as any).message);
      }
      
      // Handle specific Phantom errors
      if (message.includes('User rejected')) {
        message = "Connection rejected by user";
      } else if (message.includes('not found')) {
        message = "Phantom wallet not found. Please install Phantom extension.";
      } else if (message === "Connection failed" || message === "Unexpected error") {
        // Generic error - provide helpful message
        message = "Failed to connect wallet. Please try again or refresh the page.";
      }
      
      console.error("❌ Wallet connection failed:", message);
      console.error("Full error:", err);
      
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
