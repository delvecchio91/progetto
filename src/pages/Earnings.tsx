import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ClipboardList, TrendingUp, Loader2, Zap, 
  Clock, Play, CheckCircle, Info, Timer, Gift, Coins, Globe,
  X, ZoomIn
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WorldMapRegion } from "@/components/maps/WorldMapRegion";
import { formatUSDCRounded } from "@/lib/formatters";
import { TaskCountdownBar } from "@/components/tasks/TaskCountdownBar";
import { toast } from "@/hooks/use-toast";

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

interface UserTask {
  id: string;
  task_id: string;
  duration_days: number;
  bonus_percentage: number | null;
  started_at: string | null;
  ends_at: string | null;
  status: string | null;
  earnings: number | null;
  tasks: Task;
}

const Earnings = () => {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [durations, setDurations] = useState<DeviceDuration[]>([]);
  const [userPower, setUserPower] = useState(0);
  const [userReferralLevel, setUserReferralLevel] = useState<string | null>(null);
  const [referralLevels, setReferralLevels] = useState<ReferralLevel[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startingTask, setStartingTask] = useState(false);
  const [claimingTask, setClaimingTask] = useState<string | null>(null);
  
  // Dialog states
  const [durationDialogOpen, setDurationDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [imageZoomOpen, setImageZoomOpen] = useState(false);
  const [selectedUserTask, setSelectedUserTask] = useState<UserTask | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, userTasksRes, durationsRes, profileRes, levelsRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("*")
          .eq("is_active", true)
          .order("min_computing_power", { ascending: true }),
        supabase
          .from("user_tasks")
          .select(`
            id,
            task_id,
            duration_days,
            bonus_percentage,
            started_at,
            ends_at,
            status,
            earnings,
            tasks (
              id,
              name,
              description,
              min_computing_power,
              base_daily_reward,
              image_url,
              target_region
            )
          `)
          .eq("user_id", user!.id)
          .neq("status", "completed")
          .order("created_at", { ascending: false }),
        supabase
          .from("device_durations")
          .select("*")
          .eq("is_active", true)
          .order("days", { ascending: true }),
        supabase
          .from("profiles")
          .select("total_earnings, total_computing_power, referral_level")
          .eq("user_id", user!.id)
          .single(),
        supabase
          .from("referral_levels")
          .select("name, position_title, sort_order")
          .order("sort_order", { ascending: true }),
      ]);

      if (tasksRes.data) setTasks(tasksRes.data);
      if (userTasksRes.data) {
        const validTasks = userTasksRes.data.filter((t) => t.tasks) as UserTask[];
        setUserTasks(validTasks);
      }
      if (durationsRes.data) setDurations(durationsRes.data);
      if (profileRes.data) {
        setTotalEarnings(profileRes.data.total_earnings || 0);
        setUserPower(profileRes.data.total_computing_power || 0);
        setUserReferralLevel(profileRes.data.referral_level || "apprendista");
      }
      if (levelsRes.data) setReferralLevels(levelsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openDurationDialog = (task: Task) => {
    if (!canStartTask(task)) {
      const hasPower = availablePower >= task.min_computing_power;
      toast({
        title: "Requisiti non soddisfatti",
        description: hasPower
          ? `Richiesto livello minimo: ${getLevelDisplayName(task.min_referral_level) || task.min_referral_level}`
          : `Potenza insufficiente: richiesti ${task.min_computing_power} TH/s`,
        variant: "destructive",
      });
      return;
    }

    setSelectedTask(task);
    setDurationDialogOpen(true);
  };

  const openDetailsDialog = (userTask: UserTask) => {
    setImageZoomOpen(false);
    setSelectedUserTask(userTask);
    setDetailsDialogOpen(true);
  };

  const handleStartTask = async (duration: DeviceDuration) => {
    if (!selectedTask || !user) return;

    const hasEnoughPower = availablePower >= selectedTask.min_computing_power;
    const hasRequiredLevel = meetsTaskLevelRequirement(selectedTask);

    if (!hasEnoughPower || !hasRequiredLevel) {
      toast({
        title: "Impossibile avviare il compito",
        description: !hasEnoughPower
          ? `Potenza insufficiente: richiesti ${selectedTask.min_computing_power} TH/s`
          : `Richiesto livello minimo: ${getLevelDisplayName(selectedTask.min_referral_level) || selectedTask.min_referral_level}`,
        variant: "destructive",
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
        task_id: selectedTask.id,
        duration_days: duration.days,
        bonus_percentage: duration.bonus_percentage || 0,
        started_at: new Date().toISOString(),
        ends_at: endsAt.toISOString(),
        status: "processing",
      });

      if (error) throw error;

      setDurationDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error starting task:", error);
    } finally {
      setStartingTask(false);
    }
  };

  // Compiti attivi in elaborazione (ends_at non ancora passato)
  const activeTasks = userTasks.filter(t => {
    if (t.status !== "processing") return false;
    if (!t.ends_at) return true;
    return new Date(t.ends_at).getTime() > Date.now();
  });

  // Compiti completabili (ends_at passato ma non ancora riscossi)
  const completedTasks = userTasks.filter(t => {
    if (t.status !== "processing") return false;
    if (!t.ends_at) return false;
    return new Date(t.ends_at).getTime() <= Date.now();
  });

  // Calcola la potenza usata dai compiti attivi
  const usedPower = activeTasks.reduce((sum, task) => sum + task.tasks.min_computing_power, 0);
  const availablePower = userPower - usedPower;

  const getLevelOrder = (levelName: string | null) => {
    if (!levelName) return 0;
    return referralLevels.find((l) => l.name === levelName)?.sort_order ?? 0;
  };

  const getLevelDisplayName = (levelName: string | null) => {
    if (!levelName) return null;
    const level = referralLevels.find((l) => l.name === levelName);
    return level?.position_title || levelName;
  };

  const meetsTaskLevelRequirement = (task: Task) => {
    if (!task.min_referral_level) return true;
    const userLevel = userReferralLevel || "apprendista";
    return getLevelOrder(userLevel) >= getLevelOrder(task.min_referral_level);
  };

  const canStartTask = (task: Task) =>
    availablePower >= task.min_computing_power && meetsTaskLevelRequirement(task);

  const calculateTaskEarnings = (userTask: UserTask) => {
    const bonusMultiplier = 1 + ((userTask.bonus_percentage ?? 0) / 100);
    return userTask.tasks.base_daily_reward * userTask.duration_days * bonusMultiplier;
  };

  const handleClaimTask = async (userTask: UserTask) => {
    if (!user || claimingTask) return;

    setClaimingTask(userTask.id);
    try {
      // Use secure server-side function for task claim
      const { data, error } = await supabase.rpc('claim_task_earnings', {
        p_user_id: user.id,
        p_user_task_id: userTask.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; earnings?: number; task_name?: string };

      if (!result.success) {
        throw new Error(result.error || 'Errore durante il riscatto');
      }

      toast({
        title: "Guadagno riscosso!",
        description: `Hai ricevuto ${formatUSDCRounded(result.earnings || 0)} USDC sul tuo saldo.`,
      });

      fetchData();
    } catch (error: any) {
      console.error("Error claiming task:", error);
      toast({
        title: "Errore",
        description: "Impossibile riscuotere il guadagno. Riprova.",
        variant: "destructive",
      });
    } finally {
      setClaimingTask(null);
    }
  };

  const getRemainingTime = (endsAt: string | null) => {
    if (!endsAt) return "N/A";
    const end = new Date(endsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return "Completato";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}g ${hours}h`;
    return `${hours}h`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageLayout title="Compiti">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            icon={Zap} 
            label="Potenza Disponibile" 
            value={<>{availablePower} <span className="text-sm font-normal text-muted-foreground">TH/s</span></>}
            gradient={availablePower < userPower ? "warning" : "success"}
          />
          <StatCard 
            icon={Zap} 
            label="Potenza Totale" 
            value={<>{userPower} <span className="text-sm font-normal text-muted-foreground">TH/s</span></>}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-muted/50">
            <TabsTrigger value="available" className="relative text-xs px-2">
              Disponibili
              {tasks.length > 0 && (
                <span className="ml-1 bg-primary/20 text-primary text-[10px] px-1 py-0.5 rounded-full">
                  {tasks.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="relative text-xs px-2">
              In corso
              {activeTasks.length > 0 && (
                <span className="ml-1 bg-green-500/20 text-green-400 text-[10px] px-1 py-0.5 rounded-full">
                  {activeTasks.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="relative text-xs px-2">
              Completati
              {completedTasks.length > 0 && (
                <span className="ml-1 bg-accent/20 text-accent text-[10px] px-1 py-0.5 rounded-full">
                  {completedTasks.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Available Tasks */}
          <TabsContent value="available" className="mt-4 space-y-4">
            {loading ? (
              <GlassCard className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </GlassCard>
            ) : tasks.length === 0 ? (
              <GlassCard className="text-center py-8">
                <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nessun compito disponibile</p>
                <p className="text-sm text-muted-foreground mt-1">Torna più tardi</p>
              </GlassCard>
            ) : (
              tasks.map((task) => {
                const hasPower = availablePower >= task.min_computing_power;
                const meetsLevel = meetsTaskLevelRequirement(task);
                const canStart = hasPower && meetsLevel;

                return (
                  <GlassCard
                    key={task.id}
                    className={`p-3 cursor-pointer hover:border-primary/30 transition-colors ${
                      !canStart ? "opacity-60" : ""
                    }`}
                    onClick={() => navigate(`/task/${task.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Task Image */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                        {task.image_url ? (
                          <img
                            src={task.image_url}
                            alt={task.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ClipboardList className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-sm leading-tight truncate">
                          {task.name}
                        </h3>

                        {/* Stats inline */}
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-xs">
                            <Zap
                              className={`w-3 h-3 ${
                                hasPower ? "text-primary" : "text-destructive"
                              }`}
                            />
                            <span
                              className={
                                hasPower ? "text-muted-foreground" : "text-destructive"
                              }
                            >
                              {task.min_computing_power} TH/s
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <TrendingUp className="w-3 h-3 text-green-400" />
                            <span className="text-green-400">
                              {task.base_daily_reward} USDC/g
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="flex-shrink-0">
                        {canStart ? (
                          <Button
                            size="sm"
                            className="gradient-primary h-8 px-3 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDurationDialog(task);
                            }}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Avvia
                          </Button>
                        ) : !meetsLevel ? (
                          <div className="text-center">
                            <p className="text-[10px] text-amber-400 font-medium">
                              livello richiesto
                            </p>
                            <p className="text-[9px] text-muted-foreground">
                              {getLevelDisplayName(task.min_referral_level) || task.min_referral_level}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-[10px] text-destructive font-medium">
                              {task.min_computing_power} TH/s
                            </p>
                            <p className="text-[9px] text-muted-foreground">richiesti</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                );
              })
            )}
          </TabsContent>

          {/* Active Tasks */}
          <TabsContent value="active" className="mt-4 space-y-4">
            {loading ? (
              <GlassCard className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </GlassCard>
            ) : activeTasks.length === 0 ? (
              <GlassCard className="text-center py-8">
                <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nessun compito in corso</p>
                <p className="text-sm text-muted-foreground mt-1">Avvia un compito dalla tab "Disponibili"</p>
              </GlassCard>
            ) : (
              activeTasks.map(userTask => (
                <GlassCard 
                  key={userTask.id} 
                  className="p-3 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => openDetailsDialog(userTask)}
                >
                  <div className="flex items-center gap-3">
                    {/* Task Image */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                      {userTask.tasks.image_url ? (
                        <img 
                          src={userTask.tasks.image_url} 
                          alt={userTask.tasks.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ClipboardList className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display font-semibold text-sm truncate">{userTask.tasks.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                          <span>{userTask.duration_days}g</span>
                          {(userTask.bonus_percentage ?? 0) > 0 && (
                            <span className="text-accent">+{userTask.bonus_percentage}%</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Countdown Bar */}
                      <TaskCountdownBar 
                        endsAt={userTask.ends_at} 
                        startedAt={userTask.started_at}
                        baseDailyReward={userTask.tasks.base_daily_reward}
                        durationDays={userTask.duration_days}
                        bonusPercentage={userTask.bonus_percentage ?? 0}
                      />
                      
                      {/* Computing Power */}
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Zap className="w-3 h-3 text-primary" />
                        <span>{userTask.tasks.min_computing_power} TH/s</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </TabsContent>

          {/* Completed Tasks (ready to claim) */}
          <TabsContent value="completed" className="mt-4 space-y-4">
            {loading ? (
              <GlassCard className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </GlassCard>
            ) : completedTasks.length === 0 ? (
              <GlassCard className="text-center py-8">
                <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nessun compito completato</p>
                <p className="text-sm text-muted-foreground mt-1">I compiti terminati appariranno qui</p>
              </GlassCard>
            ) : (
              completedTasks.map(userTask => {
                const earnings = calculateTaskEarnings(userTask);
                const isClaiming = claimingTask === userTask.id;
                
                return (
                  <GlassCard 
                    key={userTask.id} 
                    className="p-4 border-accent/30 bg-accent/5 cursor-pointer hover:border-accent/50 transition-colors"
                    onClick={() => openDetailsDialog(userTask)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Task Image */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                        {userTask.tasks.image_url ? (
                          <img 
                            src={userTask.tasks.image_url} 
                            alt={userTask.tasks.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ClipboardList className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-sm truncate">{userTask.tasks.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                            <CheckCircle className="w-2.5 h-2.5 mr-1" />
                            Completato
                          </Badge>
                          <span className="text-xs text-muted-foreground">{userTask.duration_days}g</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Zap className="w-3 h-3 text-primary" />
                            <span>{userTask.tasks.min_computing_power} TH/s</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-accent" />
                            <span className="font-mono font-bold text-accent">{formatUSDCRounded(earnings)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Claim Button */}
                      <Button 
                        size="sm"
                        className="gradient-primary h-9 px-4 text-xs font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaimTask(userTask);
                        }}
                        disabled={isClaiming}
                      >
                        {isClaiming ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Gift className="w-3 h-3 mr-1" />
                            Riscuoti
                          </>
                        )}
                      </Button>
                    </div>
                  </GlassCard>
                );
              })
            )}
          </TabsContent>
        </Tabs>

        {/* Duration Selection Dialog */}
        <Dialog open={durationDialogOpen} onOpenChange={setDurationDialogOpen}>
          <DialogContent className="glass-card border-border/50 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-display text-center">
                Scegli la Durata
              </DialogTitle>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4 mt-2">
                <div className="text-center mb-4">
                  <p className="text-muted-foreground">
                    Compito: <span className="text-foreground font-semibold">{selectedTask.name}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Rendimento: {selectedTask.base_daily_reward} USDC/giorno
                  </p>
                </div>

                <div className="space-y-3">
                  {durations.map(duration => {
                    const baseEarnings = selectedTask.base_daily_reward * duration.days;
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
                              <p className="font-display font-bold flex items-center flex-wrap gap-2">
                                {duration.days} {duration.days === 1 ? "Giorno" : "Giorni"}
                                {duration.is_promo && (
                                  <Badge className="bg-accent/20 text-accent border-accent/30">
                                    {duration.promo_name || "Promo"}
                                  </Badge>
                                )}
                              </p>
                              <p className={`text-sm ${duration.days === 7 && (duration.bonus_percentage ?? 0) > 0 ? "text-green-400 font-semibold" : "text-muted-foreground"}`}>
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
            )}
          </DialogContent>
        </Dialog>

        {/* Task Details Dialog */}
        <Dialog 
          open={detailsDialogOpen} 
          onOpenChange={(open) => {
            if (!open) {
              setImageZoomOpen(false);
              setDetailsDialogOpen(false);
            }
          }}
        >
          <DialogContent className="glass-card border-border/50 max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-display text-center">
                Dettagli Compito
              </DialogTitle>
            </DialogHeader>
            {selectedUserTask && (() => {
              const isTaskCompleted = selectedUserTask.ends_at && new Date(selectedUserTask.ends_at).getTime() <= Date.now();
              
              return (
                <div className="space-y-4 mt-2">
                  {/* Task Image and Name */}
                  <div className="flex flex-col items-center gap-3">
                    <div 
                      className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex items-center justify-center relative cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedUserTask.tasks.image_url) {
                          setImageZoomOpen(true);
                        }
                      }}
                    >
                      {selectedUserTask.tasks.image_url ? (
                        <>
                          <img 
                            src={selectedUserTask.tasks.image_url} 
                            alt={selectedUserTask.tasks.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="w-6 h-6 text-white" />
                          </div>
                        </>
                      ) : (
                        <ClipboardList className="w-12 h-12 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-center">
                      <h3 className="font-display font-bold text-lg">{selectedUserTask.tasks.name}</h3>
                      {isTaskCompleted ? (
                        <Badge className="bg-accent/20 text-accent border-accent/30 mt-1">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completato
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mt-1">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          In Elaborazione
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <Zap className="w-4 h-4 mx-auto text-primary mb-1" />
                      <p className="text-xs text-muted-foreground">Potenza</p>
                      <p className="font-mono font-bold text-sm">{selectedUserTask.tasks.min_computing_power} TH/s</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <Clock className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Durata</p>
                      <p className="font-mono font-bold text-sm">{selectedUserTask.duration_days}g</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <TrendingUp className="w-4 h-4 mx-auto text-green-400 mb-1" />
                      <p className="text-xs text-muted-foreground">Bonus</p>
                      <p className="font-mono font-bold text-sm text-green-400">
                        +{selectedUserTask.bonus_percentage || 0}%
                      </p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <Timer className="w-4 h-4 mx-auto text-accent mb-1" />
                      <p className="text-xs text-muted-foreground">Rimanente</p>
                      <p className="font-mono font-bold text-sm">
                        {getRemainingTime(selectedUserTask.ends_at)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedUserTask.tasks.description && (
                    <div className="bg-background/50 rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        Descrizione
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedUserTask.tasks.description}
                      </p>
                    </div>
                  )}

                  {/* Target Region Map */}
                  {selectedUserTask.tasks.target_region && (
                    <div className="bg-background/50 rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        Area di Contributo
                      </h4>
                      <WorldMapRegion 
                        region={selectedUserTask.tasks.target_region as "africa" | "europe" | "asia" | "north_america" | "south_america" | "oceania" | "global"} 
                      />
                    </div>
                  )}
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Image Zoom Lightbox - using Portal to render outside DOM hierarchy */}
        {createPortal(
          <AnimatePresence>
            {imageZoomOpen && selectedUserTask?.tasks.image_url && (
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
                  src={selectedUserTask.tasks.image_url}
                  alt={selectedUserTask.tasks.name}
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

export default Earnings;
