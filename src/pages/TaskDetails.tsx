import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ClipboardList, TrendingUp, Loader2, Zap, 
  Clock, Play, ArrowLeft, Award, Lock, Globe,
  X, ZoomIn
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WorldMapRegion } from "@/components/maps/WorldMapRegion";

interface DeviceDuration {
  id: string;
  days: number;
  bonus_percentage: number | null;
  is_promo: boolean | null;
  promo_name: string | null;
}

interface Task {
  id: string;
  name: string;
  description: string | null;
  min_computing_power: number;
  base_daily_reward: number;
  image_url: string | null;
  min_referral_level: string | null;
  target_region: string | null;
}

interface ReferralLevel {
  name: string;
  position_title: string | null;
  sort_order: number;
}

const TaskDetails = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [task, setTask] = useState<Task | null>(null);
  const [durations, setDurations] = useState<DeviceDuration[]>([]);
  const [userPower, setUserPower] = useState(0);
  const [userReferralLevel, setUserReferralLevel] = useState<string | null>(null);
  const [referralLevels, setReferralLevels] = useState<ReferralLevel[]>([]);
  const [usedPower, setUsedPower] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startingTask, setStartingTask] = useState(false);
  const [durationDialogOpen, setDurationDialogOpen] = useState(false);
  const [imageZoomOpen, setImageZoomOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && taskId) {
      fetchData();
    }
  }, [user, taskId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [taskRes, durationsRes, profileRes, activeTasksRes, levelsRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("*")
          .eq("id", taskId)
          .eq("is_active", true)
          .single(),
        supabase
          .from("device_durations")
          .select("*")
          .eq("is_active", true)
          .order("days", { ascending: true }),
        supabase
          .from("profiles")
          .select("total_computing_power, referral_level")
          .eq("user_id", user!.id)
          .single(),
        supabase
          .from("user_tasks")
          .select(`
            id,
            tasks (min_computing_power)
          `)
          .eq("user_id", user!.id)
          .eq("status", "processing"),
        supabase
          .from("referral_levels")
          .select("name, position_title, sort_order")
          .order("sort_order", { ascending: true }),
      ]);

      if (taskRes.data) setTask(taskRes.data);
      if (durationsRes.data) setDurations(durationsRes.data);
      if (profileRes.data) {
        setUserPower(profileRes.data.total_computing_power || 0);
        setUserReferralLevel(profileRes.data.referral_level || 'apprendista');
      }
      if (activeTasksRes.data) {
        const used = activeTasksRes.data.reduce((sum, t) => {
          const taskData = t.tasks as { min_computing_power: number } | null;
          return sum + (taskData?.min_computing_power || 0);
        }, 0);
        setUsedPower(used);
      }
      if (levelsRes.data) {
        setReferralLevels(levelsRes.data);
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLevelOrder = () => {
    const level = referralLevels.find(l => l.name === userReferralLevel);
    return level?.sort_order ?? 0;
  };

  const getRequiredLevelOrder = () => {
    if (!task?.min_referral_level) return 0;
    const level = referralLevels.find(l => l.name === task.min_referral_level);
    return level?.sort_order ?? 0;
  };

  const getLevelDisplayName = (levelName: string | null) => {
    if (!levelName) return null;
    const level = referralLevels.find(l => l.name === levelName);
    return level?.position_title || levelName;
  };

  const meetsLevelRequirement = !task?.min_referral_level || getUserLevelOrder() >= getRequiredLevelOrder();

  const handleStartTask = async (duration: DeviceDuration) => {
    if (!task || !user) return;
    
    // Double-check requirements before starting task
    const currentAvailablePower = userPower - usedPower;
    const hasEnoughPower = currentAvailablePower >= task.min_computing_power;
    
    // Check level requirement
    let hasRequiredLevel = true;
    if (task.min_referral_level) {
      const userLevelObj = referralLevels.find(l => l.name === userReferralLevel);
      const requiredLevelObj = referralLevels.find(l => l.name === task.min_referral_level);
      const userOrder = userLevelObj?.sort_order ?? 0;
      const requiredOrder = requiredLevelObj?.sort_order ?? 0;
      hasRequiredLevel = userOrder >= requiredOrder;
    }
    
    if (!hasEnoughPower || !hasRequiredLevel) {
      console.error("Cannot start task: requirements not met", { 
        hasEnoughPower, 
        hasRequiredLevel,
        userLevel: userReferralLevel,
        requiredLevel: task.min_referral_level 
      });
      setDurationDialogOpen(false);
      return;
    }

    setStartingTask(true);
    try {
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + duration.days);

      const { error } = await supabase.from("user_tasks").insert({
        user_id: user.id,
        task_id: task.id,
        duration_days: duration.days,
        bonus_percentage: duration.bonus_percentage || 0,
        started_at: new Date().toISOString(),
        ends_at: endsAt.toISOString(),
        status: "processing",
      });

      if (error) throw error;

      setDurationDialogOpen(false);
      navigate("/earnings");
    } catch (error: any) {
      console.error("Error starting task:", error);
    } finally {
      setStartingTask(false);
    }
  };

  const availablePower = userPower - usedPower;
  const hasSufficientPower = task ? availablePower >= task.min_computing_power : false;
  const canStart = hasSufficientPower && meetsLevelRequirement;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!task) {
    return (
      <PageLayout title="Compito non trovato">
        <GlassCard className="text-center py-8">
          <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Compito non trovato o non disponibile</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate("/earnings")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna ai compiti
          </Button>
        </GlassCard>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Dettagli Compito">
      <div className="space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate("/earnings")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna ai compiti
        </Button>

        {/* Task Header */}
        <GlassCard className="p-6">
          <div className="flex flex-col items-center gap-4">
            {/* Task Image */}
            <div 
              className="w-28 h-28 rounded-2xl overflow-hidden bg-muted flex items-center justify-center relative cursor-pointer group"
              onClick={() => {
                if (task.image_url) {
                  setImageZoomOpen(true);
                }
              }}
            >
              {task.image_url ? (
                <>
                  <img 
                    src={task.image_url} 
                    alt={task.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : (
                <ClipboardList className="w-14 h-14 text-muted-foreground" />
              )}
            </div>

            {/* Task Name - Full Title */}
            <h1 className="font-display font-bold text-2xl text-center leading-tight">
              {task.name}
            </h1>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <Zap className={`w-5 h-5 ${hasSufficientPower ? "text-primary" : "text-destructive"}`} />
                <span className={`font-medium ${hasSufficientPower ? "" : "text-destructive"}`}>
                  {task.min_computing_power} TH/s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="font-medium text-green-400">
                  {task.base_daily_reward} USDC/giorno
                </span>
              </div>
            </div>

            {/* Level Requirement Badge */}
            {task.min_referral_level && (
              <div className={`mt-2 flex items-center gap-2 px-3 py-1.5 rounded-full ${
                meetsLevelRequirement 
                  ? "bg-green-500/20 border border-green-500/30" 
                  : "bg-amber-500/20 border border-amber-500/30"
              }`}>
                <Award className={`w-4 h-4 ${meetsLevelRequirement ? "text-green-400" : "text-amber-400"}`} />
                <span className={`text-sm ${meetsLevelRequirement ? "text-green-400" : "text-amber-400"}`}>
                  Livello minimo: {getLevelDisplayName(task.min_referral_level)}
                </span>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Description */}
        <GlassCard className="p-6">
          <h2 className="font-display font-bold text-lg mb-3">Descrizione</h2>
          {task.description ? (
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>
          ) : (
            <p className="text-muted-foreground italic">
              Nessuna descrizione disponibile per questo compito.
            </p>
          )}
        </GlassCard>

        {/* World Map Region */}
        {task.target_region && (
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold text-lg">Area di Contributo</h2>
            </div>
            <WorldMapRegion 
              region={task.target_region as "africa" | "europe" | "asia" | "north_america" | "south_america" | "oceania" | "global"} 
            />
          </GlassCard>
        )}

        {/* Power Status */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                hasSufficientPower ? "bg-primary/20" : "bg-destructive/20"
              }`}>
                <Zap className={`w-5 h-5 ${hasSufficientPower ? "text-primary" : "text-destructive"}`} />
              </div>
              <div>
                <p className="font-medium">Potenza Disponibile</p>
                <p className="text-sm text-muted-foreground">
                  {availablePower} / {userPower} TH/s
                </p>
              </div>
            </div>
            {hasSufficientPower ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Sufficiente
              </Badge>
            ) : (
              <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                Insufficiente
              </Badge>
            )}
          </div>
        </GlassCard>

        {/* Level Requirement Status - only show if task has level requirement */}
        {task.min_referral_level && (
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  meetsLevelRequirement ? "bg-green-500/20" : "bg-amber-500/20"
                }`}>
                  {meetsLevelRequirement ? (
                    <Award className="w-5 h-5 text-green-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-amber-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Livello Referral</p>
                  <p className="text-sm text-muted-foreground">
                    Tuo: {getLevelDisplayName(userReferralLevel)} → Richiesto: {getLevelDisplayName(task.min_referral_level)}
                  </p>
                </div>
              </div>
              {meetsLevelRequirement ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Idoneo
                </Badge>
              ) : (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  Bloccato
                </Badge>
              )}
            </div>
          </GlassCard>
        )}

        {/* Action */}
        {canStart ? (
          <Button 
            className="w-full gradient-primary py-6 text-lg"
            onClick={() => setDurationDialogOpen(true)}
          >
            <Play className="w-5 h-5 mr-2" />
            Avvia Compito
          </Button>
        ) : !meetsLevelRequirement ? (
          /* Level requirement not met */
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center">
              <Lock className="w-8 h-8 mx-auto text-amber-400 mb-2" />
              <p className="text-amber-400 font-medium">
                Compito Bloccato
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Richiesto livello {getLevelDisplayName(task.min_referral_level)}
              </p>
            </div>
            
            <GlassCard className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Raggiungi il livello {getLevelDisplayName(task.min_referral_level)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Invita nuovi membri e aumenta la tua potenza di calcolo
                  </p>
                </div>
              </div>
              
              <div className="bg-background/50 rounded-lg p-3 mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Tuo livello attuale</span>
                  <span className="font-medium">{getLevelDisplayName(userReferralLevel)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Livello richiesto</span>
                  <span className="font-medium text-amber-400">{getLevelDisplayName(task.min_referral_level)}</span>
                </div>
              </div>
              
              <Button 
                className="w-full"
                onClick={() => navigate("/referral")}
              >
                Vai al Programma Referral
              </Button>
            </GlassCard>
          </div>
        ) : (
          /* Power insufficient */
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
              <p className="text-destructive font-medium">
                Potenza insufficiente - Richiesti {task.min_computing_power} TH/s
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Hai {availablePower} TH/s disponibili
              </p>
            </div>
            
            <GlassCard className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Ti servono ancora {task.min_computing_power - availablePower} TH/s
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Acquista dispositivi per raggiungere la potenza richiesta
                  </p>
                </div>
              </div>
              
              <div className="bg-background/50 rounded-lg p-3 mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Potenza attuale</span>
                  <span className="font-medium">{availablePower} TH/s</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Potenza richiesta</span>
                  <span className="font-medium">{task.min_computing_power} TH/s</span>
                </div>
                <div className="border-t border-border/50 pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-400 font-medium">Potenza mancante</span>
                    <span className="text-amber-400 font-bold">{task.min_computing_power - availablePower} TH/s</span>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full"
                onClick={() => navigate("/products")}
              >
                Esplora Dispositivi
              </Button>
            </GlassCard>
          </div>
        )}

        {/* Duration Selection Dialog */}
        <Dialog open={durationDialogOpen} onOpenChange={setDurationDialogOpen}>
          <DialogContent className="glass-card border-border/50 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-display text-center">
                Scegli la Durata
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="text-center mb-4">
                <p className="text-muted-foreground">
                  Compito: <span className="text-foreground font-semibold">{task.name}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Rendimento: {task.base_daily_reward} USDC/giorno
                </p>
              </div>

              <div className="space-y-3">
                {durations.map(duration => {
                  const baseEarnings = task.base_daily_reward * duration.days;
                  const bonusMultiplier = 1 + ((duration.bonus_percentage ?? 0) / 100);
                  const totalEarnings = baseEarnings * bonusMultiplier;
                  
                  return (
                    <button
                      key={duration.id}
                      className="w-full p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/50 transition-all text-left"
                      onClick={() => handleStartTask(duration)}
                      disabled={startingTask}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-display font-bold">
                              {duration.days} {duration.days === 1 ? "Giorno" : "Giorni"}
                              {duration.is_promo && (
                                <Badge className="ml-2 bg-accent/20 text-accent border-accent/30">
                                  {duration.promo_name || "Promo"}
                                </Badge>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {(duration.bonus_percentage ?? 0) > 0 
                                ? `+${duration.bonus_percentage}% bonus`
                                : "Rendimento standard"
                              }
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-bold text-green-400">
                            {totalEarnings.toFixed(2)} USDC
                          </p>
                          <p className="text-xs text-muted-foreground">Guadagno finale</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Zoom Lightbox - using Portal to render outside DOM hierarchy */}
        {createPortal(
          <AnimatePresence>
            {imageZoomOpen && task?.image_url && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
                onClick={() => setImageZoomOpen(false)}
              >
                <button
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageZoomOpen(false);
                  }}
                >
                  <X className="w-6 h-6 text-white" />
                </button>
                <motion.img
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  src={task.image_url}
                  alt={task.name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    </PageLayout>
  );
};

export default TaskDetails;
