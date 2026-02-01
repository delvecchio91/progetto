import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Loader2, AlertTriangle, Save, Wallet, Clock } from "lucide-react";
import { formatUSDCRounded } from "@/lib/formatters";
import { useTransactionPin } from "@/hooks/useTransactionPin";
import { TransactionPinModal } from "@/components/TransactionPinModal";
import { SetupPinModal } from "@/components/SetupPinModal";

const MIN_WITHDRAWAL = 20;
const MAX_WITHDRAWAL = 100000;

// Check if current time is within withdrawal hours (Mon-Fri, 9:00-18:00 Italian time)
const isWithinWithdrawalHours = (): { allowed: boolean; message: string } => {
  // Get current time in Italian timezone
  const now = new Date();
  const italianTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Rome" }));
  
  const dayOfWeek = italianTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = italianTime.getHours();
  const minutes = italianTime.getMinutes();
  
  // Check if it's weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { 
      allowed: false, 
      message: "withdrawalHoursWeekend"
    };
  }
  
  // Check if it's before 9:00
  if (hours < 9) {
    return { 
      allowed: false, 
      message: "withdrawalHoursBefore"
    };
  }
  
  // Check if it's after 18:00
  if (hours >= 18) {
    return { 
      allowed: false, 
      message: "withdrawalHoursAfter"
    };
  }
  
  return { allowed: true, message: "" };
};

type PendingAction = 
  | { type: 'withdrawal'; amount: number; address: string }
  | { type: 'saveWallet'; address: string };

const WalletWithdraw = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [savedWalletAddress, setSavedWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingWallet, setSavingWallet] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSetupPinModal, setShowSetupPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const { hasPin, isLoading: pinLoading, verifyPin, refreshPinStatus } = useTransactionPin();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("wallet_balance, saved_wallet_address")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setBalance(data.wallet_balance || 0);
            if (data.saved_wallet_address) {
              setSavedWalletAddress(data.saved_wallet_address);
              setWalletAddress(data.saved_wallet_address);
            }
          }
        });
    }
  }, [user]);

  const handleSaveWalletClick = () => {
    if (!walletAddress.trim() || walletAddress.length < 20) {
      toast({ title: t("invalidWalletAddress"), variant: "destructive" });
      return;
    }

    // Check if user has PIN set up
    if (!hasPin) {
      setPendingAction({ type: 'saveWallet', address: walletAddress.trim() });
      setShowSetupPinModal(true);
      return;
    }

    // Request PIN verification
    setPendingAction({ type: 'saveWallet', address: walletAddress.trim() });
    setShowPinModal(true);
  };

  const processSaveWallet = async (address: string) => {
    setSavingWallet(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ saved_wallet_address: address })
        .eq("user_id", user!.id);

      if (error) throw error;

      setSavedWalletAddress(address);
      toast({ title: t("walletSaved") });
    } catch (error: any) {
      toast({ title: t("error"), variant: "destructive" });
    } finally {
      setSavingWallet(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check withdrawal hours
    const withdrawalCheck = isWithinWithdrawalHours();
    if (!withdrawalCheck.allowed) {
      toast({ 
        title: t("withdrawalsNotAvailable"), 
        description: t(withdrawalCheck.message as any),
        variant: "destructive" 
      });
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({ title: t("invalidAmount"), variant: "destructive" });
      return;
    }

    if (amountNum < MIN_WITHDRAWAL) {
      toast({ title: `${t("minWithdrawal")} ${MIN_WITHDRAWAL} USDC`, variant: "destructive" });
      return;
    }

    if (amountNum > MAX_WITHDRAWAL) {
      toast({ title: `${t("maxWithdrawalError")}`, variant: "destructive" });
      return;
    }

    if (amountNum > balance) {
      toast({ title: t("insufficientBalance"), variant: "destructive" });
      return;
    }

    if (!walletAddress.trim() || walletAddress.length < 20) {
      toast({ title: t("invalidWalletAddress"), variant: "destructive" });
      return;
    }

    // Check if user has PIN set up
    if (!hasPin) {
      setPendingAction({ type: 'withdrawal', amount: amountNum, address: walletAddress.trim() });
      setShowSetupPinModal(true);
      return;
    }

    // Request PIN verification
    setPendingAction({ type: 'withdrawal', amount: amountNum, address: walletAddress.trim() });
    setShowPinModal(true);
  };

  const processWithdrawal = async (amountNum: number, address: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: user!.id,
        type: "withdrawal",
        amount: amountNum,
        wallet_address: address,
        status: "pending",
      });

      if (error) throw error;

      setSubmitted(true);
      toast({ title: t("withdrawalRequestSent") });
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

  const handlePinConfirm = async (pin: string): Promise<boolean> => {
    const isValid = await verifyPin(pin);
    if (isValid && pendingAction) {
      if (pendingAction.type === 'withdrawal') {
        await processWithdrawal(pendingAction.amount, pendingAction.address);
      } else if (pendingAction.type === 'saveWallet') {
        await processSaveWallet(pendingAction.address);
      }
      setPendingAction(null);
    }
    return isValid;
  };

  const handlePinSetupSuccess = () => {
    refreshPinStatus();
    if (pendingAction) {
      setShowPinModal(true);
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

  if (submitted) {
    return (
      <PageLayout title={t("withdrawTitle")}>
        <div className="space-y-6">
          <GlassCard className="text-center py-8">
            <div className="w-16 h-16 rounded-full gradient-primary mx-auto mb-4 flex items-center justify-center">
              <Check className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-display font-bold mb-2">{t("withdrawalSent")}</h2>
            <p className="text-muted-foreground mb-4">
              {t("withdrawalPending")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("withdrawalProcessingTime")}
            </p>
          </GlassCard>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/wallet")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("backToWallet")}
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={t("withdrawTitle")}
      showBack
    >
      <div className="space-y-6">
        {/* Balance */}
        <GlassCard gradient="primary">
          <p className="text-sm text-muted-foreground">{t("availableBalance")}</p>
          <p className="text-2xl font-display font-bold">{formatUSDCRounded(balance)}</p>
        </GlassCard>

        {/* Withdrawal hours check */}
        {(() => {
          const withdrawalCheck = isWithinWithdrawalHours();
          if (!withdrawalCheck.allowed) {
            return (
              <GlassCard className="text-center py-8 border-yellow-500/30">
                <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">{t("withdrawalsNotAvailable")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t(withdrawalCheck.message as any)}
                </p>
                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">{t("withdrawalHours")}</p>
                  <p>{t("mondayToFriday")}, 9:00 - 18:00</p>
                </div>
              </GlassCard>
            );
          }
          return null;
        })()}

        {balance < MIN_WITHDRAWAL ? (
          <GlassCard className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">{t("insufficientBalance")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("minWithdrawal")} {formatUSDCRounded(MIN_WITHDRAWAL)}.
            </p>
          </GlassCard>
        ) : isWithinWithdrawalHours().allowed ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <GlassCard className="space-y-4">
              <div className="space-y-2">
                <Label>{t("amountToWithdraw")}</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={MIN_WITHDRAWAL}
                  max={balance}
                  step="0.01"
                  className="text-2xl font-mono h-14 text-center"
                />
                <p className="text-xs text-muted-foreground text-center">
                  {t("minWithdrawal")} {MIN_WITHDRAWAL} USDC | Max: {formatUSDCRounded(balance)}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.filter(qa => qa <= balance).map((qa) => (
                  <Button
                    key={qa}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(qa.toString())}
                    className={amount === qa.toString() ? "border-primary" : ""}
                  >
                    ${qa}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(balance.toString())}
                  className={amount === balance.toString() ? "border-primary" : ""}
                >
                  {t("max")}
                </Button>
              </div>
            </GlassCard>

            <GlassCard className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("walletAddress")}</Label>
                <button
                  type="button"
                  onClick={handleSaveWalletClick}
                  disabled={savingWallet || !walletAddress.trim() || walletAddress.length < 20}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={savedWalletAddress === walletAddress.trim() ? t("walletSaved") : t("save")}
                >
                  {savingWallet ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : savedWalletAddress === walletAddress.trim() ? (
                    <Wallet className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{t("save")}</span>
                </button>
              </div>
              <Input
                placeholder={t("enterWalletAddress")}
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="font-mono text-sm"
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
              />
              <p className="text-xs text-muted-foreground">
                {t("walletAddressWarning")}
              </p>
            </GlassCard>

            <Button 
              type="submit" 
              className="w-full gradient-primary h-14 text-lg"
              disabled={loading || !amount || !walletAddress}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t("requestWithdrawal")
              )}
            </Button>
          </form>
        ) : null}

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div>
            <h4 className="font-semibold text-sm">{t("withdrawalHoursInfo")}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {t("withdrawalHoursDesc")} <span className="font-medium text-foreground">{t("mondayToFriday")}</span>, {t("fromTo")} <span className="font-medium text-foreground">9:00</span> {t("to")} <span className="font-medium text-foreground">18:00</span>
            </p>
          </div>
        <div>
            <h4 className="font-semibold text-sm">{t("withdrawInfo")}</h4>
            <ul className="text-xs text-muted-foreground space-y-1 mt-1">
              <li>• {t("minWithdrawal")} {MIN_WITHDRAWAL} USDC</li>
              <li>• {t("maxWithdrawal")}</li>
              <li>• {t("network")}</li>
              <li>• {t("processingTime")}</li>
              <li>• {t("networkFees")}</li>
            </ul>
          </div>
        </div>
      </div>

      <TransactionPinModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPendingAction(null);
        }}
        onConfirm={handlePinConfirm}
        title={pendingAction?.type === 'saveWallet' ? t("confirmSaveWallet") : t("confirmWithdrawal")}
        description={t("enterPinToConfirm")}
        isLoading={loading || savingWallet}
      />

      <SetupPinModal
        isOpen={showSetupPinModal}
        onClose={() => {
          setShowSetupPinModal(false);
          setPendingAction(null);
        }}
        onSuccess={handlePinSetupSuccess}
      />
    </PageLayout>
  );
};

export default WalletWithdraw;
