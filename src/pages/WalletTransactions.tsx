import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDownLeft, ArrowUpRight, Loader2, RefreshCw, Users, ShoppingCart, Coins } from "lucide-react";
import { formatUSDC, formatUSDCRounded } from "@/lib/formatters";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  exact_amount: number | null;
  status: string | null;
  wallet_address: string | null;
  created_at: string | null;
  processed_at: string | null;
  notes: string | null;
}

const WalletTransactions = () => {
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completata</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rifiutata</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">In attesa</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === "mining") {
      return (
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <ArrowDownLeft className="w-5 h-5 text-primary" />
        </div>
      );
    }
    if (type === "referral_purchase" || type === "referral_mining" || type === "referral_task" || type === "referral_salary") {
      return (
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-purple-400" />
        </div>
      );
    }
    if (type === "purchase") {
      return (
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-blue-400" />
        </div>
      );
    }
    if (type === "task_earning") {
      return (
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
          <ArrowDownLeft className="w-5 h-5 text-accent" />
        </div>
      );
    }
    if (type === "tcoin_conversion") {
      return (
        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
          <Coins className="w-5 h-5 text-yellow-400" />
        </div>
      );
    }
    if (type === "admin_credit") {
      return (
        <div className="w-10 h-10 rounded-xl bg-lime-500/20 flex items-center justify-center">
          <ArrowDownLeft className="w-5 h-5 text-lime-400" />
        </div>
      );
    }
    return type === "deposit" ? (
      <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
        <ArrowDownLeft className="w-5 h-5 text-green-400" />
      </div>
    ) : (
      <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
        <ArrowUpRight className="w-5 h-5 text-orange-400" />
      </div>
    );
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "deposit":
        return "Deposito";
      case "withdrawal":
        return "Prelievo";
      case "mining":
        return "Mining";
      case "purchase":
        return "Acquisto Dispositivo";
      case "referral_purchase":
        return "Bonus Team (Acquisto)";
      case "referral_mining":
        return "Bonus Team (Mining)";
      case "task_earning":
        return "Guadagno Compito";
      case "referral_task":
        return "Bonus Team (Compito)";
      case "referral_salary":
        return "Stipendio Mensile";
      case "tcoin_conversion":
        return "Conversione T-Coin";
      case "admin_credit":
        return "Accredito Admin";
      default:
        return type;
    }
  };

  const isPositiveTransaction = (type: string) => {
    return ["deposit", "mining", "referral_purchase", "referral_mining", "task_earning", "referral_task", "referral_salary", "tcoin_conversion", "admin_credit"].includes(type);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageLayout
      title="Transazioni"
      showBack
      rightElement={
        <button onClick={fetchTransactions} className="p-2 rounded-lg hover:bg-muted">
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <GlassCard className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </GlassCard>
        ) : transactions.length === 0 ? (
          <GlassCard className="text-center py-12">
            <ArrowDownLeft className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nessuna transazione</p>
            <p className="text-sm text-muted-foreground mt-1">
              Le tue transazioni appariranno qui
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate("/wallet/deposit")}
            >
              Effettua un deposito
            </Button>
          </GlassCard>
        ) : (
          transactions.map((tx) => (
            <GlassCard key={tx.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getTypeIcon(tx.type)}
                  <div>
                    <p className="font-semibold">
                      {getTypeLabel(tx.type)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.created_at
                        ? format(new Date(tx.created_at), "dd MMM yyyy, HH:mm", { locale: it })
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-bold ${isPositiveTransaction(tx.type) ? "text-green-400" : "text-foreground"}`}>
                    {isPositiveTransaction(tx.type) ? "+" : "-"}
                    {tx.type === "deposit" 
                      ? formatUSDC(Math.abs(tx.exact_amount ?? tx.amount))
                      : formatUSDCRounded(Math.abs(tx.exact_amount ?? tx.amount))}
                  </p>
                  {getStatusBadge(tx.status)}
                </div>
              </div>

              {tx.wallet_address && (
                <div className="bg-background/50 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground mb-1">Wallet</p>
                  <code className="text-xs break-all">{tx.wallet_address}</code>
                </div>
              )}

              {tx.notes && (
                <div className="bg-background/50 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground mb-1">Note</p>
                  <p className="text-sm">{tx.notes}</p>
                </div>
              )}

              {tx.status === "completed" && tx.processed_at && (
                <p className="text-xs text-muted-foreground">
                  Elaborata il {format(new Date(tx.processed_at), "dd MMM yyyy, HH:mm", { locale: it })}
                </p>
              )}
            </GlassCard>
          ))
        )}
      </div>
    </PageLayout>
  );
};

export default WalletTransactions;