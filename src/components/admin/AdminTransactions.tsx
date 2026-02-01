import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeftRight, RefreshCw, Check, X, ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownLeft, Copy, Search, TrendingUp, Users, Coins,
  ShoppingCart, Wallet, DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  exact_amount: number | null;
  status: string | null;
  wallet_address: string | null;
  notes: string | null;
  created_at: string | null;
}

interface TransactionWithUser extends Transaction {
  user_email?: string;
  username?: string;
  user_code?: string;
}

export const AdminTransactions = () => {
  const [transactions, setTransactions] = useState<TransactionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const pageSize = 10;

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // First, if searching, find matching user IDs
      let matchingUserIds: string[] | null = null;
      
      if (searchQuery.trim()) {
        const searchTerm = searchQuery.trim().toLowerCase();
        const { data: matchingProfiles } = await supabase
          .from("profiles")
          .select("user_id")
          .or(`email.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,user_code.ilike.%${searchTerm}%`);
        
        matchingUserIds = matchingProfiles?.map(p => p.user_id) || [];
        
        // If search returns no users, show empty result
        if (matchingUserIds.length === 0) {
          setTransactions([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }
      }

      let query = supabase
        .from("transactions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Apply user filter if searching
      if (matchingUserIds) {
        query = query.in("user_id", matchingUserIds);
      }

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Apply type filter
      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      // Apply pagination
      query = query.range(page * pageSize, (page + 1) * pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      
      // Fetch user profiles for each transaction
      const userIds = [...new Set((data || []).map(tx => tx.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, username, user_code")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const transactionsWithUsers: TransactionWithUser[] = (data || []).map(tx => ({
        ...tx,
        user_email: profileMap.get(tx.user_id)?.email,
        username: profileMap.get(tx.user_id)?.username,
        user_code: profileMap.get(tx.user_id)?.user_code,
      }));

      setTransactions(transactionsWithUsers);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, statusFilter, typeFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchTransactions();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      // Find the transaction to get user_id, type and amount
      const transaction = transactions.find(tx => tx.id === id);
      if (!transaction) throw new Error("Transazione non trovata");

      const updateData: any = {
        status: newStatus,
        processed_at: new Date().toISOString(),
        processed_by: user?.id,
      };

      const { error } = await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // If approved or rejected, update user's wallet balance and send notification
      if (newStatus === "completed") {
        // Get current user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("wallet_balance")
          .eq("user_id", transaction.user_id)
          .maybeSingle();

        if (profileError) throw profileError;

        const currentBalance = profile?.wallet_balance || 0;
        let newBalance: number;

        if (transaction.type === "deposit") {
          // Add exact_amount for deposits (includes decimals)
          const depositAmount = transaction.exact_amount ?? transaction.amount;
          newBalance = currentBalance + depositAmount;
        } else {
          // Subtract amount for withdrawals
          newBalance = currentBalance - transaction.amount;
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ wallet_balance: newBalance })
          .eq("user_id", transaction.user_id);

        if (updateError) throw updateError;

        // Send notification for completed transaction
        const notificationTitle = transaction.type === "deposit" 
          ? "Deposito approvato!" 
          : "Prelievo completato!";
        const notificationMessage = transaction.type === "deposit"
          ? `Il tuo deposito di ${(transaction.exact_amount ?? transaction.amount).toFixed(2)} USDC è stato approvato e accreditato sul tuo saldo.`
          : `Il tuo prelievo di ${transaction.amount.toFixed(2)} USDC è stato elaborato con successo.`;

        await supabase.from("notifications").insert({
          user_id: transaction.user_id,
          title: notificationTitle,
          message: notificationMessage,
        });
      }

      // Send notification for rejected transaction
      if (newStatus === "rejected") {
        const notificationTitle = transaction.type === "deposit" 
          ? "Deposito rifiutato" 
          : "Prelievo rifiutato";
        const notificationMessage = transaction.type === "deposit"
          ? `Il tuo deposito di ${(transaction.exact_amount ?? transaction.amount).toFixed(2)} USDC è stato rifiutato. Contatta il supporto per maggiori informazioni.`
          : `Il tuo prelievo di ${transaction.amount.toFixed(2)} USDC è stato rifiutato. Contatta il supporto per maggiori informazioni.`;

        await supabase.from("notifications").insert({
          user_id: transaction.user_id,
          title: notificationTitle,
          message: notificationMessage,
        });
      }

      toast({ title: `Transazione ${newStatus === "completed" ? "approvata" : "rifiutata"}!` });
      fetchTransactions();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

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
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="w-4 h-4 text-green-400" />;
      case "withdrawal":
        return <ArrowUpRight className="w-4 h-4 text-orange-400" />;
      case "task_earning":
        return <TrendingUp className="w-4 h-4 text-blue-400" />;
      case "referral_purchase":
        return <Users className="w-4 h-4 text-purple-400" />;
      case "referral_task":
        return <Users className="w-4 h-4 text-pink-400" />;
      case "tcoin_conversion":
        return <Coins className="w-4 h-4 text-yellow-400" />;
      case "purchase":
        return <ShoppingCart className="w-4 h-4 text-cyan-400" />;
      case "referral_salary":
        return <Wallet className="w-4 h-4 text-emerald-400" />;
      case "admin_credit":
        return <DollarSign className="w-4 h-4 text-lime-400" />;
      case "rental_renewal":
        return <RefreshCw className="w-4 h-4 text-sky-400" />;
      default:
        return <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "deposit":
        return "Deposito";
      case "withdrawal":
        return "Prelievo";
      case "task_earning":
        return "Compiti";
      case "referral_purchase":
        return "Bonus Referral 5%";
      case "referral_task":
        return "Bonus Referral 3%";
      case "tcoin_conversion":
        return "Conversione T-Coin";
      case "purchase":
        return "Acquisto Dispositivo";
      case "referral_salary":
        return "Stipendio Mensile";
      case "admin_credit":
        return "Accredito Admin";
      case "rental_renewal":
        return "Rinnovo Noleggio";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "bg-green-500/20";
      case "withdrawal":
        return "bg-orange-500/20";
      case "task_earning":
        return "bg-blue-500/20";
      case "referral_purchase":
        return "bg-purple-500/20";
      case "referral_task":
        return "bg-pink-500/20";
      case "tcoin_conversion":
        return "bg-yellow-500/20";
      case "purchase":
        return "bg-cyan-500/20";
      case "referral_salary":
        return "bg-emerald-500/20";
      case "admin_credit":
        return "bg-lime-500/20";
      case "rental_renewal":
        return "bg-sky-500/20";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Transazioni</h2>
              <p className="text-sm text-muted-foreground">{totalCount} transazioni totali</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={fetchTransactions}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cerca utente (email, username, codice)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-44 bg-background/50">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tipi</SelectItem>
              <SelectItem value="deposit">Depositi</SelectItem>
              <SelectItem value="withdrawal">Prelievi</SelectItem>
              <SelectItem value="task_earning">Compiti</SelectItem>
              <SelectItem value="referral_purchase">Bonus Referral 5%</SelectItem>
              <SelectItem value="referral_task">Bonus Referral 3%</SelectItem>
              <SelectItem value="tcoin_conversion">Conversione T-Coin</SelectItem>
              <SelectItem value="purchase">Acquisto Dispositivo</SelectItem>
              <SelectItem value="referral_salary">Stipendio Mensile</SelectItem>
              <SelectItem value="admin_credit">Accredito Admin</SelectItem>
              <SelectItem value="rental_renewal">Rinnovo Noleggio</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-36 bg-background/50">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="pending">In attesa</SelectItem>
              <SelectItem value="completed">Completate</SelectItem>
              <SelectItem value="rejected">Rifiutate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      <div className="space-y-3">
        {loading ? (
          <GlassCard className="p-8 flex justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </GlassCard>
        ) : transactions.length === 0 ? (
          <GlassCard className="p-8 text-center text-muted-foreground">
            Nessuna transazione
          </GlassCard>
        ) : (
          transactions.map((tx) => (
            <GlassCard key={tx.id} className="p-3">
              <div className="flex flex-col gap-2">
                {/* Header: User + Amount + Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(tx.type)}`}>
                      {getTypeIcon(tx.type)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {tx.username || tx.user_email?.split('@')[0] || 'Utente'}
                      </p>
                      <p className="text-xs text-muted-foreground">{tx.user_email || '—'}</p>
                      <p className="text-xs text-muted-foreground">{tx.user_code || '—'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold">
                      ${tx.type === "deposit" && tx.exact_amount ? tx.exact_amount.toFixed(4) : tx.amount.toFixed(2)}
                    </p>
                    {getStatusBadge(tx.status)}
                  </div>
                </div>

                {/* Type + Date inline */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{getTypeLabel(tx.type)} • {tx.created_at ? format(new Date(tx.created_at), "dd/MM/yy HH:mm", { locale: it }) : "—"}</span>
                </div>

                {tx.wallet_address && (
                  <div className="flex items-center gap-1">
                    <code className="text-xs bg-muted px-2 py-0.5 rounded flex-1 truncate">
                      {tx.wallet_address}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(tx.wallet_address!);
                        toast({ title: "Indirizzo copiato!" });
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                {/* Actions */}
                {tx.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white text-xs"
                      onClick={() => handleUpdateStatus(tx.id, "completed")}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Approva
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs"
                      onClick={() => handleUpdateStatus(tx.id, "rejected")}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Rifiuta
                    </Button>
                  </div>
                )}
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Pagina {page + 1} di {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
