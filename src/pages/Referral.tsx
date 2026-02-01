import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatPower } from "@/lib/formatters";
import { motion } from "framer-motion";
import { Users, Zap, Gift, Copy, Share2, UserPlus, Check, ChevronRight } from "lucide-react";
import { ReferralLevelModal } from "@/components/referral/ReferralLevelModal";
import { useToast } from "@/hooks/use-toast";

// Import centralized avatar utility
import { 
  level1Avatar, 
  level2Avatar, 
  level3Avatar, 
  level4Avatar, 
  level5Avatar, 
  level6Avatar 
} from "@/lib/avatars";

interface Profile {
  user_code: string;
  referral_earnings: number;
  total_computing_power: number;
  referral_level: string;
}

interface ReferralLevel {
  id: string;
  name: string;
  position_title: string | null;
  min_computing_power: number;
  min_members: number;
  monthly_salary: number;
  sort_order: number;
}

const LEVEL_CONFIG: Record<string, { avatar: string; label: string; color: string }> = {
  apprendista: { avatar: level1Avatar, label: "Apprendista", color: "from-amber-700 to-amber-500" },
  tecnico_base: { avatar: level2Avatar, label: "Tecnico Base", color: "from-gray-400 to-gray-300" },
  tecnico_esperto: { avatar: level3Avatar, label: "Tecnico Esperto", color: "from-yellow-500 to-yellow-300" },
  specialista: { avatar: level4Avatar, label: "Specialista", color: "from-cyan-400 to-blue-400" },
  responsabile: { avatar: level5Avatar, label: "Responsabile", color: "from-purple-500 to-pink-400" },
  direttore: { avatar: level6Avatar, label: "Direttore", color: "from-yellow-400 to-orange-400" },
};

const Referral = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [levels, setLevels] = useState<ReferralLevel[]>([]);
  const [teamCount, setTeamCount] = useState(0);
  const [activeTeamCount, setActiveTeamCount] = useState(0);
  const [teamPower, setTeamPower] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchLevels();
    }
  }, [user]);

  useEffect(() => {
    if (profile?.user_code) {
      fetchTeamData();
    }
  }, [profile?.user_code]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_code, referral_earnings, total_computing_power, referral_level")
      .eq("user_id", user!.id)
      .single();
    if (data) setProfile(data);
  };

  const fetchLevels = async () => {
    const { data } = await supabase
      .from("referral_levels")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setLevels(data);
  };

  const fetchTeamData = async () => {
    // Fetch team members (only email verified)
    const { data: teamMembers } = await supabase
      .from("profiles")
      .select("user_id, total_computing_power")
      .eq("inviter_code", profile!.user_code)
      .eq("email_verified", true);

    if (teamMembers) {
      setTeamCount(teamMembers.length);
      const totalPower = teamMembers.reduce((sum, m) => sum + (m.total_computing_power || 0), 0);
      setTeamPower(totalPower);

      // Check active members (with active devices)
      const memberIds = teamMembers.map(m => m.user_id);
      if (memberIds.length > 0) {
        const { count } = await supabase
          .from("user_devices")
          .select("user_id", { count: "exact", head: true })
          .in("user_id", memberIds)
          .eq("status", "active");
        setActiveTeamCount(count || 0);
      }
    }
  };

  const getCurrentLevel = (): ReferralLevel | null => {
    if (!levels.length) return null;
    return levels.find(l => l.name === profile?.referral_level) || levels[0];
  };

  const getNextLevel = (): ReferralLevel | null => {
    const current = getCurrentLevel();
    if (!current || !levels.length) return null;
    const nextIndex = levels.findIndex(l => l.name === current.name) + 1;
    return nextIndex < levels.length ? levels[nextIndex] : null;
  };

  const getProgressToNextLevel = () => {
    const next = getNextLevel();
    if (!next) return { members: 100, power: 100 };
    
    const membersProgress = Math.min((teamCount / next.min_members) * 100, 100);
    const powerProgress = Math.min((teamPower / next.min_computing_power) * 100, 100);
    
    return { members: membersProgress, power: powerProgress };
  };

  const copyCode = () => {
    if (profile?.user_code) {
      navigator.clipboard.writeText(profile.user_code);
      setCopied(true);
      toast({ title: t("codeCopied") });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyLink = () => {
    if (profile?.user_code) {
      const link = `${window.location.origin}/auth?ref=${profile.user_code}`;
      navigator.clipboard.writeText(link);
      toast({ title: t("linkCopied") });
    }
  };

  const shareLink = async () => {
    if (profile?.user_code) {
      const link = `${window.location.origin}/auth?ref=${profile.user_code}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: t("joinMyTeam"),
            text: t("useMyInviteCode"),
            url: link,
          });
        } catch {
          copyLink();
        }
      } else {
        copyLink();
      }
    }
  };

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();
  const progress = getProgressToNextLevel();
  const currentConfig = currentLevel ? LEVEL_CONFIG[currentLevel.name] : LEVEL_CONFIG.apprendista;

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageLayout title={t("referralProgram")}>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-muted-foreground">{t("inviteFriendsEarn")}</p>
        </motion.div>

        {/* Current Level Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <p className="text-sm text-white">{t("currentLevel")}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={currentConfig.avatar} 
                    alt={`${t("level")} ${currentLevel?.sort_order || 1}`}
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary/50"
                  />
                  <div>
                    <h2 className="text-2xl font-display font-bold">
                      {t("level")} {currentLevel?.sort_order || 1}
                    </h2>
                  </div>
                </div>
                
                <div className="px-4 py-2 rounded-lg bg-primary/20 border border-primary/30">
                  <p className="text-xs text-muted-foreground text-center">{t("position")}</p>
                  <p className="text-lg font-bold text-primary text-center">
                    {currentLevel?.position_title || "Apprendista"}
                  </p>
                </div>
              </div>

              {nextLevel && (
                <>
                  <Separator className="my-4 h-[4px]" />
                  <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">{t("nextLevel")}</span>
                    <img 
                      src={LEVEL_CONFIG[nextLevel.name]?.avatar} 
                      alt={`${t("level")} ${nextLevel.sort_order}`}
                      className="w-8 h-8 rounded-full object-cover border border-primary/30"
                    />
                    <span className="text-sm font-semibold text-green-400 ml-auto">
                      + {nextLevel.monthly_salary} USDC/{t("perMonth")}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("reference")}</span>
                      <span>{teamCount} / {nextLevel.min_members}</span>
                    </div>
                    <Progress value={progress.members} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("hashPower")}</span>
                      <span>{formatPower(teamPower)} / {formatPower(nextLevel.min_computing_power)}</span>
                    </div>
                    <Progress value={progress.power} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-pink-500 [&>div]:to-purple-500" />
                  </div>
                  </div>
                </>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-3"
        >
          <GlassCard className="text-center p-4">
            <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-xs text-muted-foreground">{t("invited")}</p>
            <p className="text-xl font-bold">{teamCount}</p>
            <p className="text-xs text-green-400">{activeTeamCount} {t("activeCount")}</p>
          </GlassCard>
          
          <GlassCard className="text-center p-4">
            <Zap className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            <p className="text-xs text-muted-foreground">{t("hashPower")}</p>
            <p className="text-xl font-bold">{Math.round(teamPower)}</p>
            <p className="text-xs text-muted-foreground">TH/s</p>
          </GlassCard>
          
          <GlassCard className="text-center p-4">
            <Gift className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <p className="text-xs text-muted-foreground">{t("bonus")}</p>
            <p className="text-xl font-bold">{Math.round(profile.referral_earnings)}</p>
            <p className="text-xs text-muted-foreground">USDC</p>
          </GlassCard>
        </motion.div>

        {/* Invite Code Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="overflow-hidden" gradient="accent">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold">{t("yourInviteCodeTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("shareWithFriends")}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-card/80 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">{t("inviteCodeLabel")}</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-display font-bold text-primary tracking-wider">
                    {profile.user_code}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyCode}
                    className="shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-card/80 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">{t("inviteLink")}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {window.location.origin}/auth?ref={profile.user_code}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={copyLink}
                  className="h-12"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {t("copyLink")}
                </Button>
                <Button
                  onClick={shareLink}
                  className="h-12 gradient-primary"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {t("share")}
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Levels Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h3 className="font-display font-bold text-lg">{t("levelsReference")}</h3>
          
          {levels.map((level, index) => {
            const config = LEVEL_CONFIG[level.name];
            const isCurrentLevel = level.name === (currentLevel?.name || 'apprendista');
            
            return (
              <GlassCard 
                key={level.id}
                className={`relative overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] ${isCurrentLevel ? 'ring-2 ring-primary' : ''}`}
                gradient={isCurrentLevel ? "primary" : undefined}
                onClick={() => setShowLevelModal(true)}
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={config?.avatar} 
                    alt={`${t("level")} ${level.sort_order}`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-border/50 shrink-0"
                  />
                  
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold">{t("level")} {level.sort_order}</h4>
                    <span className="text-sm font-medium text-primary block">
                      {level.position_title || "—"}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {level.min_members}+ {t("referrals")} · {formatPower(level.min_computing_power)}
                    </p>
                  </div>
                  
                  <div className={`px-3 py-1.5 rounded-lg text-center shrink-0 w-[100px] ${level.monthly_salary > 0 ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-muted'}`}>
                    <p className={`text-sm font-bold ${level.monthly_salary > 0 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                      {level.monthly_salary > 0 ? `${level.monthly_salary} USDC` : t("none")}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("perMonth")}</p>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  
                  {isCurrentLevel && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                      {t("current")}
                    </span>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </motion.div>

        {/* Level Details Modal */}
        <ReferralLevelModal
          open={showLevelModal}
          onOpenChange={setShowLevelModal}
          levels={levels}
          currentLevelName={currentLevel?.name || 'apprendista'}
        />
      </div>
    </PageLayout>
  );
};

export default Referral;
