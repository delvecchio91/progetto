import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, Check, Loader2, AlertCircle } from "lucide-react";

// Genera 4 cifre decimali casuali per creare un importo univoco
const generateUniqueAmount = (baseAmount: number): number => {
  const randomDecimals = Math.floor(Math.random() * 10000) / 10000;
  return Math.round((baseAmount + randomDecimals) * 10000) / 10000;
};

type Step = "amount" | "payment" | "success";

const WalletDeposit = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [amount, setAmount] = useState("");
  const [exactAmount, setExactAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [step, setStep] = useState<Step>("amount");
  const [depositWallet, setDepositWallet] = useState<string>("");
  const [loadingWallet, setLoadingWallet] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch admin wallet using secure RPC function
  useEffect(() => {
    const fetchAdminWallet = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.rpc("get_deposit_wallet");

        if (error) throw error;
        setDepositWallet(data || "");
      } catch (error) {
        console.error("Error fetching admin wallet:", error);
      } finally {
        setLoadingWallet(false);
      }
    };

    fetchAdminWallet();
  }, [user]);

  const copyWallet = () => {
    if (!depositWallet) return;
    navigator.clipboard.writeText(depositWallet);
    setCopiedWallet(true);
    toast({ title: t("addressCopied") });
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const copyExactAmount = () => {
    if (exactAmount) {
      navigator.clipboard.writeText(exactAmount.toFixed(4).replace('.', ','));
      setCopiedAmount(true);
      toast({ title: t("amountCopied") });
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const handleContinue = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 20) {
      toast({ title: `${t("minimum")} 20 USDC`, variant: "destructive" });
      return;
    }
    // Genera l'importo univoco
    setExactAmount(generateUniqueAmount(amountNum));
    setStep("payment");
  };

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || !exactAmount) {
      toast({ title: t("invalidAmount"), variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: user!.id,
        type: "deposit",
        amount: amountNum,
        exact_amount: exactAmount,
        status: "pending",
      });

      if (error) throw error;

      setStep("success");
      toast({ title: t("depositRequestSent") });
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [50, 100, 200, 500];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Step 3: Success
  if (step === "success") {
    return (
      <PageLayout title={t("depositTitle")} showBack>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-display font-bold">{t("requestSent")}</h2>
            <p className="text-muted-foreground max-w-sm">
              {t("depositPending")}
            </p>
          </div>

          <Button 
            variant="outline" 
            onClick={() => navigate("/wallet")}
            className="mt-4"
          >
            {t("backToWallet")}
          </Button>
        </div>
      </PageLayout>
    );
  }

  // Step 2: Payment Details
  if (step === "payment") {
    return (
      <PageLayout title={t("depositTitle")} showBack>
        <div className="space-y-6">
          {/* Alert Importante */}
          <div className="bg-primary/20 border border-primary rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">{t("important")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("importantDepositNote")}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Details Card */}
          <GlassCard className="space-y-5">
            {/* Importo esatto */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("exactAmountToSend")}</p>
              <div className="bg-background/50 rounded-xl p-4 flex items-center justify-between">
                <span className="text-2xl font-mono font-bold text-primary">
                  {exactAmount?.toFixed(4).replace('.', ',')} USDC
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={copyExactAmount}
                  className="h-10 w-10"
                >
                  {copiedAmount ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            {/* Wallet Address */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("destinationWallet")}</p>
              {loadingWallet ? (
                <div className="bg-background/50 rounded-xl p-4 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : depositWallet ? (
                <div className="bg-background/50 rounded-xl p-4 flex items-center justify-between gap-3">
                  <code className="text-sm break-all flex-1">{depositWallet}</code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={copyWallet}
                    className="h-10 w-10 flex-shrink-0"
                  >
                    {copiedWallet ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </Button>
                </div>
              ) : (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-center">
                  <p className="text-sm text-destructive">{t("walletNotConfigured")}</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit}
            className="w-full gradient-primary h-14 text-lg font-semibold"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t("paymentMade")
            )}
          </Button>

          {/* Back Button */}
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => setStep("amount")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("editAmount")}
          </Button>
        </div>
      </PageLayout>
    );
  }

  // Step 1: Amount Input
  return (
    <PageLayout title={t("depositTitle")} showBack>
      <div className="space-y-6">
        <GlassCard className="space-y-6">
          <div className="space-y-2">
            <p className="font-medium">{t("enterAmountToDeposit")}</p>
          </div>

          {/* Amount Input */}
          <div className="relative">
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="20"
              step="1"
              className="text-3xl font-mono h-16 text-center pr-20 bg-background/50 border-border/50"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              USDC
            </span>
          </div>

          {/* Quick Amounts */}
          <div className="grid grid-cols-4 gap-3">
            {quickAmounts.map((qa) => (
              <Button
                key={qa}
                type="button"
                variant="outline"
                onClick={() => setAmount(qa.toString())}
                className={`h-12 text-base font-medium ${
                  amount === qa.toString() 
                    ? "border-primary bg-primary/10" 
                    : "bg-background/50 border-border/50"
                }`}
              >
                {qa}
              </Button>
            ))}
          </div>
        </GlassCard>

        {/* Continue Button */}
        <Button 
          onClick={handleContinue}
          className="w-full gradient-primary h-14 text-lg font-semibold"
          disabled={!amount || parseFloat(amount) < 20}
        >
          {t("continue")}
        </Button>

        <p className="text-center text-sm font-medium text-primary">
          {t("minimum")} 20 USDC
        </p>
      </div>
    </PageLayout>
  );
};

export default WalletDeposit;
