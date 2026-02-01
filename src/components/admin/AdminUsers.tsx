import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, Users, Wallet, Cpu, RefreshCw, ChevronLeft, ChevronRight,
  Mail, Phone, TrendingUp, User, CheckCircle, ShieldCheck, Filter
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  phone: string | null;
  username: string | null;
  user_code: string;
  wallet_balance: number | null;
  total_computing_power: number | null;
  total_earnings: number | null;
  referral_level: string | null;
  created_at: string | null;
  email_verified: boolean | null;
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showUnverifiedOnly, setShowUnverifiedOnly] = useState(false);
  const { toast } = useToast();
  const pageSize = 10;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (search) {
        query = query.or(`email.ilike.%${search}%,user_code.ilike.%${search}%,username.ilike.%${search}%`);
      }

      if (showUnverifiedOnly) {
        query = query.or("email_verified.is.null,email_verified.eq.false");
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setUsers(data || []);
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
    fetchUsers();
  }, [page, search, showUnverifiedOnly]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const formatCurrency = (value: number | null) => {
    return `$${(value || 0).toFixed(2)}`;
  };

  const getLevelColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case "gold":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "silver":
        return "bg-gray-400/20 text-gray-300 border-gray-400/30";
      case "platinum":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "diamond":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      default:
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    }
  };

  const handleVerifyEmail = async (userId: string, email: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ email_verified: true })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Email verificata",
        description: `L'email di ${email} è stata verificata con successo.`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Gestione Utenti</h2>
              <p className="text-sm text-muted-foreground">{totalCount} utenti totali</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cerca email, nome o codice..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="pl-10 bg-background/50"
              />
            </div>
            <Button
              variant={showUnverifiedOnly ? "default" : "outline"}
              size="icon"
              onClick={() => {
                setShowUnverifiedOnly(!showUnverifiedOnly);
                setPage(0);
              }}
              title={showUnverifiedOnly ? "Mostra tutti" : "Solo non verificati"}
            >
              <Filter className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchUsers}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        {showUnverifiedOnly && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <Badge variant="secondary" className="gap-1">
              <Filter className="w-3 h-3" />
              Filtro attivo: Solo email non verificate
            </Badge>
          </div>
        )}
      </GlassCard>

      <div className="space-y-3">
        {loading ? (
          <GlassCard className="p-8 flex justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </GlassCard>
        ) : users.length === 0 ? (
          <GlassCard className="p-8 text-center text-muted-foreground">
            Nessun utente trovato
          </GlassCard>
        ) : (
          users.map((user) => (
            <GlassCard key={user.id} className="p-3">
              <div className="flex flex-col gap-2">
                {/* Header: Avatar + Name + Level */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {user.username || user.email.split('@')[0]}
                      </p>
                      <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {user.user_code}
                      </code>
                    </div>
                  </div>
                  <Badge className={`capitalize ${getLevelColor(user.referral_level)}`}>
                    {user.referral_level || "bronze"}
                  </Badge>
                </div>

                {/* Contact Info */}
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                      <Wallet className="w-3 h-3" />
                      <span className="text-[10px]">Saldo</span>
                    </div>
                    <p className="font-mono font-bold text-sm text-green-400">
                      {formatCurrency(user.wallet_balance)}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                      <Cpu className="w-3 h-3" />
                      <span className="text-[10px]">Potenza</span>
                    </div>
                    <p className="font-mono font-bold text-sm text-primary">
                      {(user.total_computing_power || 0).toFixed(0)} TH/s
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-[10px]">Guadagni</span>
                    </div>
                    <p className="font-mono font-bold text-sm text-yellow-400">
                      {formatCurrency(user.total_earnings)}
                    </p>
                  </div>
                </div>

                {/* Footer: Date + Verify Button */}
                <div className="flex items-center justify-between pt-1 border-t border-border/30">
                  <div className="text-xs text-muted-foreground">
                    Registrato: {user.created_at ? format(new Date(user.created_at), "dd MMM yyyy", { locale: it }) : "—"}
                  </div>
                  {user.email_verified ? (
                    <div className="flex items-center gap-1 text-green-400 text-xs">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Verificato</span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleVerifyEmail(user.user_id, user.email)}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verifica Email
                    </Button>
                  )}
                </div>
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
