import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Gift, Search, RefreshCw, Cpu, User, CheckCircle2 
} from "lucide-react";

interface MiningDevice {
  id: string;
  name: string;
  price: number;
  computing_power: number;
}


interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  username: string | null;
  user_code: string;
}

export const AdminGiftDevice = () => {
  const [devices, setDevices] = useState<MiningDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userCode, setUserCode] = useState("");
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState("");
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("mining_devices")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;

      setDevices(data || []);
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
  }, []);

  const searchUser = async () => {
    if (!userCode.trim()) return;
    
    setSearching(true);
    setFoundUser(null);
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, email, username, user_code")
        .eq("user_code", userCode.trim().toUpperCase())
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          toast({
            title: "Utente non trovato",
            description: "Nessun utente con questo codice",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      setFoundUser(data);
      toast({ title: "Utente trovato!" });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleGiftDevice = async () => {
    if (!foundUser || !selectedDevice) {
      toast({
        title: "Errore",
        description: "Seleziona utente e dispositivo",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    
    try {
      const device = devices.find(d => d.id === selectedDevice);
      
      if (!device) throw new Error("Dispositivo non trovato");

      // Insert gifted device (user will choose duration when starting)
      const { error: insertError } = await supabase
        .from("user_devices")
        .insert({
          user_id: foundUser.user_id,
          device_id: device.id,
          is_gifted: true,
          status: "standby",
          started_at: null,
          ends_at: null,
        });

      if (insertError) throw insertError;

      // Update user's total_computing_power (same as purchased devices)
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("total_computing_power")
        .eq("user_id", foundUser.user_id)
        .maybeSingle();

      const currentPower = currentProfile?.total_computing_power || 0;
      const newTotalPower = currentPower + device.computing_power;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ total_computing_power: newTotalPower })
        .eq("user_id", foundUser.user_id);

      if (updateError) throw updateError;

      // Create notification for user
      await supabase.from("notifications").insert({
        user_id: foundUser.user_id,
        title: "🎁 Hai ricevuto un regalo!",
        message: `Hai ricevuto in regalo un ${device.name}!`,
      });

      toast({ 
        title: "Dispositivo regalato!",
        description: `${device.name} regalato a ${foundUser.username || foundUser.email}`,
      });

      // Reset form
      setFoundUser(null);
      setUserCode("");
      setSelectedDevice("");
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Regala Dispositivo</h2>
              <p className="text-sm text-muted-foreground">
                Regala dispositivi agli utenti durante le promozioni
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </GlassCard>

      {loading ? (
        <GlassCard className="p-8 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Search User */}
          <GlassCard className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold">Cerca Utente</h3>
            </div>
            <div className="space-y-2">
              <Label>Codice Utente</Label>
              <div className="flex gap-2">
                <Input
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value.toUpperCase())}
                  placeholder="MX123ABC"
                  className="font-mono"
                />
                <Button 
                  onClick={searchUser} 
                  disabled={searching || !userCode.trim()}
                  variant="outline"
                >
                  {searching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {foundUser && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="font-bold text-sm">Utente Trovato</span>
                </div>
                <p className="text-sm">{foundUser.username || "—"}</p>
                <p className="text-xs text-muted-foreground">{foundUser.email}</p>
                <p className="text-xs font-mono text-muted-foreground">{foundUser.user_code}</p>
              </div>
            )}
          </GlassCard>

          {/* Select Device */}
          <GlassCard className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold">Dispositivo</h3>
            </div>
            
            <div className="space-y-2">
              <Label>Dispositivo</Label>
              <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona dispositivo" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name} - {device.computing_power} TH/s
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              L'utente sceglierà la durata del mining quando avvierà il dispositivo.
            </p>
          </GlassCard>
        </div>
      )}

      <Button 
        onClick={handleGiftDevice} 
        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
        disabled={sending || !foundUser || !selectedDevice}
      >
        {sending ? (
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Gift className="w-4 h-4 mr-2" />
        )}
        Regala Dispositivo
      </Button>
    </div>
  );
};
