import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Wallet, RefreshCw, Save } from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: string;
  updated_at: string | null;
}

export const AdminSettings = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    admin_wallet: "",
    min_withdrawal: "10",
    referral_bonus_purchase: "5",
    referral_bonus_earnings: "3",
  });
  const { toast } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*");

      if (error) throw error;
      
      setSettings(data || []);
      
      // Populate form with existing values
      const settingsMap = (data || []).reduce((acc, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {} as Record<string, string>);
      
      setFormData({
        admin_wallet: settingsMap.admin_wallet || "",
        min_withdrawal: settingsMap.min_withdrawal || "10",
        referral_bonus_purchase: settingsMap.referral_bonus_purchase || "5",
        referral_bonus_earnings: settingsMap.referral_bonus_earnings || "3",
      });
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
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsToUpsert = [
        { key: "admin_wallet", value: formData.admin_wallet.trim() },
        { key: "min_withdrawal", value: formData.min_withdrawal },
        { key: "referral_bonus_purchase", value: formData.referral_bonus_purchase },
        { key: "referral_bonus_earnings", value: formData.referral_bonus_earnings },
      ];

      for (const setting of settingsToUpsert) {
        const existing = settings.find(s => s.key === setting.key);
        
        if (existing) {
          const { error } = await supabase
            .from("settings")
            .update({ value: setting.value, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("settings")
            .insert(setting);
          if (error) throw error;
        }
      }

      toast({ title: "Impostazioni salvate!" });
      fetchSettings();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Impostazioni</h2>
              <p className="text-sm text-muted-foreground">Configura wallet e parametri</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={fetchSettings}
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
          <GlassCard className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold">Wallet Depositi</h3>
            </div>
            <div className="space-y-2">
              <Label>Indirizzo Wallet Admin (USDC)</Label>
              <Input
                value={formData.admin_wallet}
                onChange={(e) => setFormData({ ...formData, admin_wallet: e.target.value })}
                placeholder="0x..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Wallet dove gli utenti invieranno i fondi per gli acquisti
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold">Prelievi</h3>
            </div>
            <div className="space-y-2">
              <Label>Prelievo Minimo (USDC)</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={formData.min_withdrawal}
                onChange={(e) => setFormData({ ...formData, min_withdrawal: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Importo minimo per le richieste di prelievo
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-4 space-y-4 md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-accent" />
              <h3 className="font-display font-bold">Bonus Referral</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Bonus su Acquisti Membri (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.referral_bonus_purchase}
                  onChange={(e) => setFormData({ ...formData, referral_bonus_purchase: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Percentuale di bonus sugli acquisti dei membri invitati
                </p>
              </div>
              <div className="space-y-2">
                <Label>Bonus su Rendimenti Membri (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.referral_bonus_earnings}
                  onChange={(e) => setFormData({ ...formData, referral_bonus_earnings: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Percentuale di bonus sui rendimenti dei membri invitati
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      <Button 
        onClick={handleSave} 
        className="w-full gradient-primary"
        disabled={saving}
      >
        {saving ? (
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Salva Impostazioni
      </Button>
    </div>
  );
};
