import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Lock, 
  Wallet, 
  ArrowDownRight, 
  Clock, 
  Copy, 
  ExternalLink, 
  Plus,
  Eye,
  EyeOff,
  ChevronDown,
  RefreshCw,
  Info
} from "lucide-react";
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getPrivateBalance } from "@/lib/privacyCash";

const Dashboard = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawTiming, setWithdrawTiming] = useState<"now" | "later">("now");
  const [privateBalance, setPrivateBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch balance on mount
  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      setBalanceLoading(true);
      const balance = await getPrivateBalance();
      setPrivateBalance(balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setPrivateBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleRefreshBalance = async () => {
    setRefreshing(true);
    await fetchBalance();
    toast.success('Balance Updated', {
      description: 'Your private balance has been refreshed',
    });
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your private balance and payment links
              </p>
            </motion.div>

            {/* Balance & Withdraw Grid */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Private Balance Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-2xl p-6 shadow-soft"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">Private Balance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRefreshBalance}
                      disabled={refreshing}
                      className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                      title="Refresh balance"
                    >
                      <RefreshCw className={`w-4 h-4 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => setShowBalance(!showBalance)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      {showBalance ? (
                        <Eye className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <EyeOff className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  {balanceLoading ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-muted-foreground animate-pulse">
                        •••
                      </span>
                      <span className="text-xl text-muted-foreground">USDC</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">
                        {showBalance ? privateBalance.toFixed(2) : "••••••"}
                      </span>
                      <span className="text-xl text-muted-foreground">USDC</span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Private balance held in Privacy Cash pool
                  </p>
                </div>

                <div className="flex gap-3">
                  <Link to="/create" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Plus className="w-4 h-4" />
                      New Link
                    </Button>
                  </Link>
                  <Button className="flex-1">
                    <ArrowDownRight className="w-4 h-4" />
                    Withdraw
                  </Button>
                </div>
              </motion.div>

              {/* Withdraw Form Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border/50 rounded-2xl p-6 shadow-soft"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Wallet className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Withdraw Privately</h2>
                </div>

                <div className="space-y-4">
                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="withdraw-amount">Amount</Label>
                    <div className="relative">
                      <Input
                        id="withdraw-amount"
                        type="number"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="h-12 pr-16"
                      />
                      <button
                        onClick={() => setWithdrawAmount(privateBalance)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary font-medium hover:underline"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  {/* Timing */}
                  <div className="space-y-2">
                    <Label>Timing</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setWithdrawTiming("now")}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          withdrawTiming === "now"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        <ArrowDownRight className="w-4 h-4 mx-auto mb-1" />
                        Now
                      </button>
                      <button
                        onClick={() => setWithdrawTiming("later")}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          withdrawTiming === "later"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        <Clock className="w-4 h-4 mx-auto mb-1" />
                        Delay
                      </button>
                    </div>
                    {withdrawTiming === "later" && (
                      <p className="text-xs text-muted-foreground">
                        Delayed withdrawals add extra privacy by randomizing timing.
                      </p>
                    )}
                  </div>

                  {/* Destination */}
                  <div className="space-y-2">
                    <Label htmlFor="destination">Destination Wallet</Label>
                    <Input
                      id="destination"
                      placeholder="Enter wallet address"
                      className="h-12"
                    />
                  </div>

                  <Button variant="hero" className="w-full" size="lg">
                    <Lock className="w-4 h-4" />
                    Withdraw Privately
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* Payment Links Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border/50 rounded-2xl shadow-soft overflow-hidden"
            >
              <div className="p-6 border-b border-border/50 flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Payment Links</h2>
                <Link to="/create">
                  <Button size="sm">
                    <Plus className="w-4 h-4" />
                    Create Link
                  </Button>
                </Link>
              </div>

              {/* Info Alert */}
              <div className="p-6 border-b border-border/50">
                <Alert className="border-blue-500/30 bg-blue-500/5">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm text-muted-foreground">
                    Payment links you create will appear here. Links are stored locally for demo purposes. 
                    In production, they would be fetched from Privacy Cash via the backend.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Empty State */}
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No payment links yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create your first payment link to start receiving funds privately
                </p>
                <Link to="/create">
                  <Button>
                    <Plus className="w-4 h-4" />
                    Create Your First Link
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
