import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { formatUSDCRounded } from "@/lib/formatters";
import { ArrowDownCircle, ArrowUpCircle, History, Settings, MessageCircle, Coins } from "lucide-react";
import FortuneWheelIcon from "@/components/icons/FortuneWheelIcon";
import type { Profile } from "@/types/profile";

const Wallet = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tcoinBalance, setTcoinBalance] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("user_id", user.id).single()
        .then(({ data }) => {
          setProfile(data);
          setTcoinBalance(data?.tcoin_balance || 0);
        });
    }
  }, [user]);

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const openWhatsApp = () => {
    window.open("https://wa.me/393775509088", "_blank");
  };

  return (
    <PageLayout
      title={t("wallet")}
      rightElement={
        <button onClick={openWhatsApp} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
          <span className="text-xs text-muted-foreground">{t("contactWhatsApp")}</span>
          <MessageCircle className="w-5 h-5 text-success" />
        </button>
      }
    >
      <div className="space-y-6">
        {/* Balance Card */}
        <GlassCard gradient="primary" glow className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-2">{t("availableBalance")}</p>
          <p className="text-4xl font-display font-bold text-gradient">
            {formatUSDCRounded(profile.wallet_balance)}
          </p>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t("totalEarnings")}</p>
              <p className="font-semibold">{formatUSDCRounded(profile.total_earnings)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("referralBonus")}</p>
              <p className="font-semibold">{formatUSDCRounded(profile.referral_earnings)}</p>
            </div>
          </div>
        </GlassCard>

        {/* T-Coin Card */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-500/20">
                <Coins className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("tcoinBalance")}</p>
                <p className="text-xl font-bold text-yellow-500">
                  {tcoinBalance.toLocaleString("it-IT")} T-Coin
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/fortune-wheel")}
              className="gap-3 h-auto py-3 px-4 text-base border-2 border-transparent bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 hover:from-purple-500/30 hover:via-pink-500/30 hover:to-orange-500/30 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(hsl(var(--card)), hsl(var(--card))) padding-box, linear-gradient(135deg, #a855f7, #ec4899, #f97316, #eab308, #22c55e, #3b82f6, #a855f7) border-box',
              }}
            >
              <FortuneWheelIcon className="h-10 w-10" />
              <span className="text-left leading-tight font-medium">{t("fortuneWheel")}</span>
            </Button>
          </div>
        </GlassCard>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-16 flex-col gap-1"
            onClick={() => navigate("/wallet/deposit")}
          >
            <ArrowDownCircle className="w-5 h-5 text-success" />
            <span>{t("deposit")}</span>
          </Button>
          <Button
            variant="outline"
            className="h-16 flex-col gap-1"
            onClick={() => navigate("/wallet/withdraw")}
          >
            <ArrowUpCircle className="w-5 h-5 text-primary" />
            <span>{t("withdraw")}</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-14 flex-col gap-1"
            onClick={() => navigate("/wallet/transactions")}
          >
            <History className="w-4 h-4" />
            <span className="text-xs">{t("transactions")}</span>
          </Button>
          <Button
            variant="outline"
            className="h-14 flex-col gap-1"
            onClick={() => navigate("/settings")}
          >
            <Settings className="w-4 h-4" />
            <span className="text-xs">{t("settings")}</span>
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};

export default Wallet;
