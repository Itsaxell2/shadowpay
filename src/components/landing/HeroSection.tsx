import { motion } from "framer-motion";
import { Lock, Shield, ArrowRight, Wallet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useWallet } from "@/hooks/use-wallet";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";

const HeroSection = () => {
  const { connected, publicKey, loading, error, connect, disconnect } = useWallet();
  const [showError, setShowError] = useState(false);

  const handleConnect = async () => {
    await connect();
    setShowError(!!error);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient pt-16">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Powered by ShadowPay on Solana
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight text-balance"
          >
            Receive crypto payments{" "}
            <span className="gradient-text">without revealing your wallet</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance"
          >
            Create private payment links and accept crypto from anyone. Your wallet address and transaction history stay completely hidden.
          </motion.p>

          {/* Wallet Connection Status */}
          {connected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30"
            >
              <Wallet className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Connected: {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}
              </span>
              <button
                onClick={disconnect}
                className="ml-2 text-xs font-medium text-green-600 hover:text-green-700"
              >
                Disconnect
              </button>
            </motion.div>
          )}

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {!connected ? (
              <Button
                onClick={handleConnect}
                disabled={loading}
                variant="hero"
                size="xl"
                className="group"
              >
                <Wallet className="w-5 h-5" />
                {loading ? "Connecting..." : "Connect Phantom Wallet"}
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            ) : (
              <Link to="/create">
                <Button variant="hero" size="xl" className="group">
                  <Lock className="w-5 h-5" />
                  Create Private Payment Link
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="lg">
              Learn how it works
            </Button>
          </motion.div>

          {/* Error Dialog */}
          <AlertDialog open={showError} onOpenChange={setShowError}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  Connection Failed
                </AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogDescription>{error}</AlertDialogDescription>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowError(false)}>
                  Close
                </Button>
              </div>
            </AlertDialogContent>
          </AlertDialog>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <span>End-to-end private</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>No KYC required</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>Non-custodial</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
