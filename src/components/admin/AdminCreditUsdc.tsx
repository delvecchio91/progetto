import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  DollarSign, Search, Loader2, User, Mail, 
  CheckCircle, RefreshCw 
} from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  username: string | null;
  user_code: string;
  wallet_balance: number | null;
}

export const AdminCreditUsdc = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      toast.error("Inserisci un termine di ricerca");
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, email, username, user_code, wallet_balance")
        .or(`email.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%,user_code.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setUsers(data || []);
      
      if (data?.length === 0) {
        toast.info("Nessun utente trovato");
      }
    } catch (error: any) {
      toast.error("Errore nella ricerca: " + error.message);
    } finally {
      setSearching(false);
    }
  };

  const handleCredit = async () => {
    if (!selectedUser) {
      toast.error("Seleziona un utente");
      return;
    }

    const creditAmount = parseFloat(amount);
    if (isNaN(creditAmount) || creditAmount <= 0) {
      toast.error("Inserisci un importo valido");
      return;
    }

    setSubmitting(true);
    try {
      // Update user wallet balance
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          wallet_balance: (selectedUser.wallet_balance || 0) + creditAmount
        })
        .eq("user_id", selectedUser.user_id);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: selectedUser.user_id,
          type: "admin_credit",
          amount: creditAmount,
          exact_amount: creditAmount,
          status: "completed",
          notes: notes || "Accredito manuale admin",
          processed_at: new Date().toISOString()
        });

      if (txError) throw txError;

      // Create notification for user
      await supabase
        .from("notifications")
        .insert({
          user_id: selectedUser.user_id,
          title: "USDC accreditati!",
          message: `Hai ricevuto ${creditAmount.toFixed(2)} USDC. ${notes ? `Nota: ${notes}` : ""}`
        });

      toast.success(`${creditAmount.toFixed(2)} USDC accreditati a ${selectedUser.username || selectedUser.email}`);
      
      // Reset form
      setSelectedUser(null);
      setAmount("");
      setNotes("");
      setUsers([]);
      setSearchQuery("");
    } catch (error: any) {
      toast.error("Errore nell'accredito: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">Accredita USDC</h2>
            <p className="text-sm text-muted-foreground">Accredita manualmente USDC agli utenti</p>
          </div>
        </div>

        {/* Search Section */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per email, username o codice utente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                className="pl-9 bg-background/50"
              />
            </div>
            <Button 
              onClick={searchUsers} 
              disabled={searching}
              className="gradient-primary"
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* User Results */}
          {users.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Seleziona utente:</Label>
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedUser?.id === user.id
                        ? "border-primary bg-primary/10"
                        : "border-border/50 bg-card/50 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {user.username || user.email}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{user.user_code}</p>
                        <p className="text-sm font-medium text-green-400">
                          ${(user.wallet_balance || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected User & Amount */}
          {selectedUser && (
            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    Utente selezionato: {selectedUser.username || selectedUser.email}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Saldo attuale: ${(selectedUser.wallet_balance || 0).toFixed(2)} USDC
                </p>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Importo USDC</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-9 bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Note (opzionale)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Motivo dell'accredito..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-background/50 resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(null);
                      setAmount("");
                      setNotes("");
                    }}
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Annulla
                  </Button>
                  <Button
                    onClick={handleCredit}
                    disabled={submitting || !amount}
                    className="flex-1 gradient-primary"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <DollarSign className="w-4 h-4 mr-2" />
                    )}
                    Accredita USDC
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
