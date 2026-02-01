import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, RefreshCw, Percent, Tag, Sparkles
} from "lucide-react";

interface Duration {
  id: string;
  days: number;
  bonus_percentage: number | null;
  is_promo: boolean | null;
  promo_name: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

// Fixed standard durations config (1g and 3g have fixed 0% bonus, 7g has editable bonus)
const STANDARD_DURATIONS_CONFIG = [
  { days: 1, bonus_percentage: 0, label: "1 Giorno", description: "Rendimento standard", editable: false },
  { days: 3, bonus_percentage: 0, label: "3 Giorni", description: "Rendimento standard", editable: false },
  { days: 7, bonus_percentage: 0.3, label: "7 Giorni", description: "Bonus personalizzabile", editable: true },
];

export const AdminDurations = () => {
  const [durations, setDurations] = useState<Duration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sevenDayBonus, setSevenDayBonus] = useState("0.3");
  const [promoId, setPromoId] = useState<string | null>(null);
  const [promoData, setPromoData] = useState({
    days: "14",
    bonus_percentage: "1",
    promo_name: "",
    is_active: false,
  });
  const { toast } = useToast();

  const fetchDurations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("device_durations")
        .select("*")
        .order("is_promo", { ascending: true })
        .order("days", { ascending: true });

      if (error) throw error;
      setDurations(data || []);

      // Load promo data if exists (prefer active promo, otherwise latest)
      const promos = (data || []).filter((d) => d.is_promo);
      const activePromo = promos.find((p) => p.is_active);
      const latestPromo = [...promos].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))[0];
      const selectedPromo = activePromo ?? latestPromo;

      if (selectedPromo) {
        setPromoId(selectedPromo.id);
        setPromoData({
          days: selectedPromo.days.toString(),
          bonus_percentage: (selectedPromo.bonus_percentage ?? 0).toString(),
          promo_name: selectedPromo.promo_name ?? "",
          is_active: selectedPromo.is_active ?? false,
        });
      } else {
        setPromoId(null);
      }

      // Load 7-day bonus from existing record if exists
      const sevenDay = data?.find(d => !d.is_promo && d.days === 7);
      if (sevenDay) {
        setSevenDayBonus((sevenDay.bonus_percentage ?? 0.3).toString());
      }
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
    fetchDurations();
  }, []);

  // Initialize or update standard duration
  const handleToggleStandard = async (stdConfig: typeof STANDARD_DURATIONS_CONFIG[0], currentActive: boolean) => {
    setSaving(true);
    try {
      // For 7-day duration, use the editable bonus value
      const bonusToUse = stdConfig.days === 7 ? parseFloat(sevenDayBonus) || 0 : stdConfig.bonus_percentage;
      
      // Find existing record for this day count (not promo)
      const existing = durations.find(d => !d.is_promo && d.days === stdConfig.days);
      
      if (existing) {
        // Update existing - toggle active and update bonus for 7-day
        const updateData: { is_active: boolean; bonus_percentage?: number } = { 
          is_active: !currentActive 
        };
        if (stdConfig.days === 7) {
          updateData.bonus_percentage = bonusToUse;
        }
        
        const { error } = await supabase
          .from("device_durations")
          .update(updateData)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("device_durations")
          .insert({
            days: stdConfig.days,
            bonus_percentage: bonusToUse,
            is_promo: false,
            is_active: true,
          });
        if (error) throw error;
      }
      
      toast({ title: `Durata ${stdConfig.days}g ${!currentActive ? "attivata" : "disattivata"}!` });
      fetchDurations();
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

  // Check if promo data is complete enough to be activated
  const isPromoComplete = () => {
    const days = parseInt(promoData.days);
    const bonus = parseFloat(promoData.bonus_percentage);
    const name = promoData.promo_name.trim();
    return days > 0 && bonus >= 0 && name.length > 0;
  };

  // Toggle promo active status independently
  const handleTogglePromoActive = async (newActiveState: boolean) => {
    // Don't allow activation if promo is incomplete
    if (newActiveState && !isPromoComplete()) {
      toast({
        title: "Promo incompleta",
        description: "Compila giorni, bonus e nome prima di attivare la promozione",
        variant: "destructive",
      });
      return;
    }

    if (!promoId) {
      toast({
        title: "Promo non salvata",
        description: "Salva prima i dati della promozione",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Ensure there is only one active promo at a time (and allow turning all off)
      const { error: disableAllError } = await supabase
        .from("device_durations")
        .update({ is_active: false })
        .eq("is_promo", true);
      if (disableAllError) throw disableAllError;

      const { error } = await supabase
        .from("device_durations")
        .update({ is_active: newActiveState })
        .eq("id", promoId);
      if (error) throw error;

      setPromoData((prev) => ({ ...prev, is_active: newActiveState }));
      toast({ title: newActiveState ? "Promo attivata!" : "Promo disattivata!" });
      fetchDurations();
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

  // Save promo data (without changing active status)
  const handleSavePromo = async () => {
    setSaving(true);
    try {
      const existingPromo = promoId ? durations.find((d) => d.id === promoId) : null;

      const promoPayload = {
        days: parseInt(promoData.days) || 14,
        bonus_percentage: parseFloat(promoData.bonus_percentage) || 0,
        promo_name: promoData.promo_name.trim() || "Promo Speciale",
        is_promo: true,
        // Keep current active status, don't change it here
        is_active: existingPromo?.is_active ?? promoData.is_active ?? false,
      };

      if (existingPromo) {
        const { error } = await supabase
          .from("device_durations")
          .update(promoPayload)
          .eq("id", existingPromo.id);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase
          .from("device_durations")
          .insert({ ...promoPayload, is_active: false })
          .select("id")
          .single();
        if (error) throw error;
        setPromoId(inserted.id);
        setPromoData((prev) => ({ ...prev, is_active: false }));
      }

      toast({ title: "Dati promo salvati!" });
      fetchDurations();
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

  const standardDurations = durations.filter(d => !d.is_promo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-secondary flex items-center justify-center">
              <Clock className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Durate Compiti</h2>
              <p className="text-sm text-muted-foreground">
                3 durate standard + 1 promo
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={fetchDurations}
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
        <>
          {/* Standard Durations */}
          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wide px-1">
              Durate Standard
            </h3>
            
            <div className="grid gap-3 sm:grid-cols-3">
              {STANDARD_DURATIONS_CONFIG.map((stdConfig) => {
                // For 7-day, find by days only; for others, find by days
                const existing = standardDurations.find(d => d.days === stdConfig.days);
                const isActive = existing?.is_active ?? false;
                const displayBonus = stdConfig.days === 7 
                  ? parseFloat(sevenDayBonus) || 0 
                  : stdConfig.bonus_percentage;
                
                return (
                  <GlassCard 
                    key={stdConfig.days} 
                    className={`p-4 transition-all ${isActive ? "border-primary/30" : "opacity-60"}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="font-display font-bold text-xl">
                          {stdConfig.days}g
                        </span>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => handleToggleStandard(stdConfig, isActive)}
                        disabled={saving}
                      />
                    </div>
                    
                    {stdConfig.editable ? (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <Percent className="w-4 h-4" />
                          Bonus (%)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={sevenDayBonus}
                          onChange={(e) => setSevenDayBonus(e.target.value)}
                          placeholder="0.3"
                          className="h-9"
                        />
                        {parseFloat(sevenDayBonus) > 0 && (
                          <p className="text-xs text-accent">
                            +{sevenDayBonus}% bonus extra
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Percent className="w-4 h-4 text-muted-foreground" />
                        {displayBonus > 0 ? (
                          <span className="text-accent font-semibold">
                            +{displayBonus}% bonus
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Rendimento standard
                          </span>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      {stdConfig.description}
                    </p>
                  </GlassCard>
                );
              })}
            </div>
          </div>

          {/* Promo Section */}
          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wide px-1">
              Promozione Speciale
            </h3>
            
            <GlassCard className={`p-5 ${promoData.is_active ? "border-accent/50" : ""}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${promoData.is_active ? "bg-accent/20" : "bg-muted"}`}>
                  <Sparkles className={`w-5 h-5 ${promoData.is_active ? "text-accent" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-display font-semibold">Configura Promo</h4>
                  <p className="text-sm text-muted-foreground">
                    Imposta durata e bonus personalizzati
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Attiva</Label>
                  <Switch
                    checked={promoData.is_active}
                    onCheckedChange={handleTogglePromoActive}
                    disabled={saving || (!promoData.is_active && !isPromoComplete())}
                  />
                </div>
              </div>
              
              {!isPromoComplete() && !promoData.is_active && (
                <p className="text-xs text-destructive mb-4">
                  Compila tutti i campi (giorni, bonus e nome) per poter attivare la promo.
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Durata (giorni)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={promoData.days}
                    onChange={(e) => setPromoData({ ...promoData, days: e.target.value })}
                    placeholder="14"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Bonus (%)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={promoData.bonus_percentage}
                    onChange={(e) => setPromoData({ ...promoData, bonus_percentage: e.target.value })}
                    placeholder="1.5"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Nome Promo
                  </Label>
                  <Input
                    value={promoData.promo_name}
                    onChange={(e) => setPromoData({ ...promoData, promo_name: e.target.value })}
                    placeholder="Black Friday"
                  />
                </div>
              </div>

              <Button 
                className="w-full mt-4 gradient-secondary" 
                onClick={handleSavePromo}
                disabled={saving}
              >
                {saving ? "Salvataggio..." : "Salva Promozione"}
              </Button>

              {promoData.is_active && (
                <div className="mt-4 p-3 bg-accent/10 rounded-lg border border-accent/30">
                  <p className="text-sm text-accent">
                    <strong>Promo attiva:</strong> Gli utenti vedranno l'opzione "{promoData.promo_name || "Promo Speciale"}" 
                    con durata di {promoData.days} giorni e bonus del +{promoData.bonus_percentage}%
                  </p>
                </div>
              )}
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
};