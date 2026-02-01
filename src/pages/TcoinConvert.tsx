import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Coins, ArrowDown, DollarSign, CheckCircle2 } from "lucide-react";

const TcoinConvert = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [tcoinBalance, setTcoinBalance] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [conversionRate, setConversionRate] = useState(100);
  const [amount, setAmount] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    // Fetch balances
    const { data: profile } = await supabase
      .from("profiles")
      .select("tcoin_balance, wallet_balance")
      .eq("user_id", user!.id)
      .single();

    if (profile) {
      setTcoinBalance(profile.tcoin_balance || 0);
      setWalletBalance(profile.wallet_balance || 0);
    }

    // Fetch conversion rate
    const { data: settings } = await supabase
      .from("spin_settings")
      .select("tcoin_to_usdc_rate")
      .limit(1)
      .maybeSingle();

    if (settings) {
      setConversionRate(settings.tcoin_to_usdc_rate);
    }
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const usdcAmount = amount ? parseFloat(amount) / conversionRate : 0;

  const handleConvert = async () => {
    const tcoinAmount = parseFloat(amount);

    if (!tcoinAmount || tcoinAmount <= 0) {
      toast.error("Inserisci un importo valido");
      return;
    }

    if (tcoinAmount > tcoinBalance) {
      toast.error("Saldo T-Coin insufficiente");
      return;
    }

    if (tcoinAmount < conversionRate) {
      toast.error(`Minimo ${conversionRate} T-Coin per conversione`);
      return;
    }

    setIsConverting(true);

    try {
      // Use secure server-side function for conversion
      const { data, error } = await supabase.rpc("convert_tcoin_to_usdc", {
        p_user_id: user!.id,
        p_tcoin_amount: tcoinAmount,
      });

      if (error) {
        console.error("Conversion RPC error:", error);
        throw error;
      }

      // Type the response
      const result = data as {
        success: boolean;
        error?: string;
        minimum?: number;
        tcoin_deducted?: number;
        usdc_received?: number;
        new_tcoin_balance?: number;
        new_wallet_balance?: number;
      };

      if (!result?.success) {
        const errorMessage = result?.error || "Errore durante la conversione";
        if (result?.error === "Insufficient T-Coin balance") {
          toast.error("Saldo T-Coin insufficiente");
        } else if (result?.error === "Amount below minimum") {
          toast.error(`Minimo ${result.minimum} T-Coin per conversione`);
        } else {
          toast.error(errorMessage);
        }
        return;
      }

      // Update local state with server-confirmed values
      setTcoinBalance(result.new_tcoin_balance ?? 0);
      setWalletBalance(result.new_wallet_balance ?? 0);
      
      setSuccess(true);
      toast.success(`Conversione completata! +${(result.usdc_received ?? 0).toFixed(4)} USDC`);
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Errore durante la conversione");
    } finally {
      setIsConverting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <PageLayout title="Conversione" showBack>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="p-4 rounded-full bg-green-500/20">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Conversione Completata!</h2>
            <p className="text-muted-foreground">
              I tuoi USDC sono stati aggiunti al tuo wallet
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/fortune-wheel")}>
              Torna alla Ruota
            </Button>
            <Button onClick={() => navigate("/wallet")}>
              Vai al Wallet
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Converti T-Coin" showBack>
      <div className="space-y-6 pb-24">
        {/* Current Balances */}
        <div className="grid grid-cols-2 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">T-Coin</span>
            </div>
            <p className="text-xl font-bold text-yellow-500">
              {tcoinBalance.toLocaleString("it-IT")}
            </p>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-muted-foreground">USDC</span>
            </div>
            <p className="text-xl font-bold text-green-500">
              {walletBalance.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </GlassCard>
        </div>

        {/* Conversion Form */}
        <GlassCard className="p-6">
          <div className="space-y-6">
            {/* T-Coin Input */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                T-Coin da convertire
              </label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-500" />
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="pl-10 text-lg"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {[50, 100, 200, 500].map((val) => (
                  <Button
                    key={val}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(val)}
                    disabled={val > tcoinBalance}
                    className="flex-1 min-w-[60px]"
                  >
                    {val}
                  </Button>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="p-2 rounded-full bg-muted">
                <ArrowDown className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Riceverai (USDC)
              </label>
              <Input
                type="text"
                value={usdcAmount.toFixed(2)}
                readOnly
                className="text-lg bg-muted"
              />
            </div>

            {/* Rate Info */}
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-sm text-muted-foreground">
                Tasso di cambio: <span className="font-semibold">{conversionRate} T-Coin = 1 USDC</span>
              </p>
            </div>

            {/* Convert Button */}
            <Button
              onClick={handleConvert}
              disabled={isConverting || !amount || parseFloat(amount) <= 0}
              className="w-full"
              size="lg"
            >
              {isConverting ? "Conversione in corso..." : "Converti"}
            </Button>
          </div>
        </GlassCard>

        {/* Info */}
        <GlassCard className="p-4">
          <h3 className="font-semibold mb-2">Informazioni</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Conversione minima: {conversionRate} T-Coin</li>
            <li>• Gli USDC vengono aggiunti istantaneamente al wallet</li>
            <li>• La conversione è irreversibile</li>
          </ul>
        </GlassCard>
      </div>
    </PageLayout>
  );
};

export default TcoinConvert;
