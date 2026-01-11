import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Shield, Check, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const PayLink = () => {
  const [paymentState, setPaymentState] = useState<"confirm" | "processing" | "success">("confirm");
  
  // Mock payment data
  const paymentData = {
    amount: "50.00",
    token: "USDC",
  };

  const handlePay = () => {
    setPaymentState("processing");
    setTimeout(() => {
      setPaymentState("success");
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border/50 rounded-2xl shadow-soft overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {paymentState === "confirm" && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-6 sm:p-8"
                  >
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-glow">
                        <Lock className="w-7 h-7 text-primary-foreground" />
                      </div>
                      <h1 className="text-2xl font-bold text-foreground mb-2">
                        Private Payment
                      </h1>
                      <p className="text-sm text-muted-foreground">
                        Powered by Privacy Cash
                      </p>
                    </div>

                    {/* Amount Display */}
                    <div className="text-center mb-8">
                      <p className="text-muted-foreground text-sm mb-2">Amount to pay</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-4xl font-bold text-foreground">
                          {paymentData.amount}
                        </span>
                        <span className="text-xl text-muted-foreground">
                          {paymentData.token}
                        </span>
                      </div>
                    </div>

                    {/* Privacy Info */}
                    <div className="space-y-3 mb-8">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
                        <div className="flex items-center gap-3">
                          <Lock className="w-5 h-5 text-primary" />
                          <span className="text-foreground">Recipient Wallet</span>
                        </div>
                        <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Hidden
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-primary" />
                          <span className="text-foreground">Your Identity</span>
                        </div>
                        <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Hidden
                        </span>
                      </div>
                    </div>

                    {/* Privacy Note */}
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                      <p className="text-sm text-muted-foreground text-center">
                        Payment will be routed through Privacy Cash.
                        <br />
                        <span className="text-primary font-medium">No on-chain link between you and the recipient.</span>
                      </p>
                    </div>

                    {/* Pay Button */}
                    <Button
                      variant="hero"
                      size="xl"
                      className="w-full group"
                      onClick={handlePay}
                    >
                      <Lock className="w-5 h-5" />
                      Pay Privately
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Button>

                    <p className="text-xs text-muted-foreground text-center mt-4">
                      Connect your wallet to complete the payment
                    </p>
                  </motion.div>
                )}

                {paymentState === "processing" && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-8 text-center"
                  >
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground mb-3">
                      Processing Payment
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Routing through Privacy Cash pool...
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4 text-primary" />
                        Breaking on-chain link
                      </p>
                      <p className="flex items-center justify-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        Ensuring privacy
                      </p>
                    </div>
                  </motion.div>
                )}

                {paymentState === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-8 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6"
                    >
                      <Check className="w-10 h-10 text-green-500" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">
                      Payment Complete!
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Your payment was sent privately
                    </p>

                    {/* Confirmation Details */}
                    <div className="p-4 rounded-xl bg-muted/50 border border-border mb-6 text-left">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-semibold text-foreground">
                          {paymentData.amount} {paymentData.token}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status</span>
                        <span className="text-green-500 font-medium">Confirmed</span>
                      </div>
                    </div>

                    {/* Privacy Badges */}
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center gap-1.5">
                        <Lock className="w-3 h-3" />
                        Recipient Hidden
                      </span>
                      <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center gap-1.5">
                        <Shield className="w-3 h-3" />
                        Identity Hidden
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Payment routed through Privacy Cash
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PayLink;
