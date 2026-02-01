import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Gift, RefreshCw, Search, Users, UserCheck, 
  Send, Check, Loader2 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  username: string | null;
  user_code: string;
}

interface SpinSettings {
  id: string;
  daily_spins: number;
}

export const AdminFortuneWheel = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [settings, setSettings] = useState<SpinSettings | null>(null);
  const [grantingAll, setGrantingAll] = useState(false);
  const [grantingUserId, setGrantingUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch spin settings
      const { data: spinSettings } = await supabase
        .from("spin_settings")
        .select("id, daily_spins")
        .limit(1)
        .maybeSingle();

      if (spinSettings) {
        setSettings(spinSettings);
      }

      // Fetch users
      let query = supabase
        .from("profiles")
        .select("id, user_id, email, username, user_code")
        .order("created_at", { ascending: false })
        .limit(100);

      if (search) {
        query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%,user_code.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
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
    fetchData();
  }, [search]);

  const grantSpinsToUser = async (profile: Profile) => {
    if (!settings) return;
    
    setGrantingUserId(profile.user_id);
    try {
      // Reset user spins (set spins_used to 0 so they have 3 available)
      const { data: existingSpins } = await supabase
        .from("user_spins")
        .select("id")
        .eq("user_id", profile.user_id)
        .maybeSingle();

      if (existingSpins) {
        await supabase
          .from("user_spins")
          .update({ 
            spins_used: 0, 
            last_spin_reset: new Date().toISOString() 
          })
          .eq("user_id", profile.user_id);
      } else {
        await supabase.from("user_spins").insert({
          user_id: profile.user_id,
          spins_used: 0,
          last_spin_reset: new Date().toISOString(),
        });
      }

      // Create notification for the user
      await supabase.from("notifications").insert({
        user_id: profile.user_id,
        title: "🎉 Hai vinto 3 giri alla Ruota della Fortuna!",
        message: "Congratulazioni! Sei stato estratto come vincitore e hai ricevuto 3 giri gratuiti alla Ruota della Fortuna. Vai subito a girare la ruota per vincere T-Coin!",
      });

      toast({
        title: "Giri assegnati!",
        description: `${settings.daily_spins} giri assegnati a ${profile.username || profile.email}`,
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGrantingUserId(null);
    }
  };

  const grantSpinsToAll = async () => {
    if (!settings) return;
    
    setGrantingAll(true);
    try {
      // Fetch all user IDs
      const { data: allProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, email, username");

      if (profilesError) throw profilesError;

      if (!allProfiles || allProfiles.length === 0) {
        toast({
          title: "Nessun utente",
          description: "Non ci sono utenti nel sistema",
          variant: "destructive",
        });
        return;
      }

      // Reset all user spins
      for (const profile of allProfiles) {
        const { data: existingSpins } = await supabase
          .from("user_spins")
          .select("id")
          .eq("user_id", profile.user_id)
          .maybeSingle();

        if (existingSpins) {
          await supabase
            .from("user_spins")
            .update({ 
              spins_used: 0, 
              last_spin_reset: new Date().toISOString() 
            })
            .eq("user_id", profile.user_id);
        } else {
          await supabase.from("user_spins").insert({
            user_id: profile.user_id,
            spins_used: 0,
            last_spin_reset: new Date().toISOString(),
          });
        }

        // Create notification for each user
        await supabase.from("notifications").insert({
          user_id: profile.user_id,
          title: "🎉 Hai vinto 3 giri alla Ruota della Fortuna!",
          message: "Congratulazioni! Sei stato estratto come vincitore e hai ricevuto 3 giri gratuiti alla Ruota della Fortuna. Vai subito a girare la ruota per vincere T-Coin!",
        });
      }

      toast({
        title: "Giri assegnati a tutti!",
        description: `${settings.daily_spins} giri assegnati a ${allProfiles.length} utenti`,
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGrantingAll(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Gift className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Ruota della Fortuna</h2>
              <p className="text-sm text-muted-foreground">
                Gestisci i giri degli utenti
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Grant All Button */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/20">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="font-semibold">Abilita tutti gli utenti</p>
              <p className="text-sm text-muted-foreground">
                Assegna {settings?.daily_spins || 3} giri a tutti gli utenti e invia notifica
              </p>
            </div>
          </div>
          <Button
            onClick={grantSpinsToAll}
            disabled={grantingAll}
            className="gap-2 gradient-primary"
          >
            {grantingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Assegnando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Abilita Tutti
              </>
            )}
          </Button>
        </div>
      </GlassCard>

      {/* Search */}
      <GlassCard className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per email, username o codice utente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </GlassCard>

      {/* Users List */}
      {loading ? (
        <GlassCard className="p-8 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </GlassCard>
      ) : users.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-muted-foreground">Nessun utente trovato</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {users.map((profile) => (
            <GlassCard key={profile.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">
                        {profile.username || "Utente"}
                      </p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {profile.user_code}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {profile.email}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => grantSpinsToUser(profile)}
                  disabled={grantingUserId === profile.user_id}
                  className="gap-2 shrink-0"
                >
                  {grantingUserId === profile.user_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Abilita Giri
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};
