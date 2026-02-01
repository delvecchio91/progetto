import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { formatUSDCRounded, formatPower } from "@/lib/formatters";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Users, Copy, Gift, Megaphone, Check, Shield, ChevronRight, X, Sparkles, CheckCheck, Cpu } from "lucide-react";
import IntroVideoPlayer from "@/components/home/IntroVideoPlayer";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useToast } from "@/hooks/use-toast";
import { getAvatarByLevel } from "@/lib/avatars";
import type { ProfileWithPosition } from "@/types/profile";

interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<ProfileWithPosition | null>(null);
  const [teamCount, setTeamCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/welcome");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      checkAdminRole();
      fetchAnnouncements();
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (profile?.user_code) {
      fetchTeamCount();
    }
  }, [profile?.user_code]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedAnnouncement || showNotifications) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedAnnouncement, showNotifications]);

  const fetchProfile = async () => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single();
    
    if (profileData) {
      // Fetch position title from referral_levels
      const { data: levelData } = await supabase
        .from("referral_levels")
        .select("position_title")
        .eq("name", profileData.referral_level || "bronze")
        .maybeSingle();
      
      setProfile({
        ...profileData,
        position_title: levelData?.position_title || null
      });
    }
  };

  const checkAdminRole = async () => {
    const { data } = await supabase.rpc("has_role", { 
      _user_id: user!.id, 
      _role: "admin" 
    });
    setIsAdmin(!!data);
  };

  const fetchTeamCount = async () => {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("inviter_code", profile!.user_code)
      .eq("email_verified", true);
    setTeamCount(count || 0);
  };

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("id, title, content, image_url")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (data) setAnnouncements(data);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setNotifications(data);
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) {
      toast({ title: t("noNotificationsToMark") });
      return;
    }
    
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
    
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast({ title: t("allNotificationsRead") });
    }
  };

  const copyInviteCode = () => {
    if (profile?.user_code) {
      navigator.clipboard.writeText(profile.user_code);
      setCopied(true);
      toast({ title: t("codeCopied") });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageLayout
      leftElement={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-primary/20">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <span className="font-display font-bold text-2xl brand-glow tracking-tight">iCore</span>
        </div>
      }
      rightElement={
        <div className="flex items-center gap-1">
          {isAdmin && (
            <button 
              onClick={() => navigate("/admin")}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Shield className="w-5 h-5 text-primary" />
            </button>
          )}
          <LanguageSelector />
          <button 
            onClick={() => setShowNotifications(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <img 
              src={getAvatarByLevel(profile.referral_level)}
              alt="Avatar Livello"
              className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
            />
            <div>
              <p className="text-muted-foreground text-sm">{t("welcomeUser")}</p>
              <h1 className="text-2xl font-display font-bold">
                {profile.username || "Miner"} 👋🏼
              </h1>
            </div>
          </div>
          {profile.position_title && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">{t("currentPosition")}</p>
              <span className="px-3 py-1.5 text-sm font-bold rounded-full bg-primary/20 text-primary border border-primary/30 whitespace-nowrap">
                {profile.position_title}
              </span>
            </div>
          )}
        </motion.div>

        {/* Balance Card */}
        <GlassCard gradient="primary" glow className="relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-sm text-muted-foreground mb-1">{t("availableBalance")}</p>
            <p className="text-3xl font-display font-bold text-gradient">
              {formatUSDCRounded(profile.wallet_balance)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {t("power")}: {formatPower(profile.total_computing_power)}
            </p>
          </div>
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full gradient-primary opacity-20 blur-2xl" />
        </GlassCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div onClick={() => navigate("/team")} className="cursor-pointer">
            <StatCard
              icon={Users}
              label={t("yourTeam")}
              value={teamCount}
              subValue={t("activeMembers")}
            />
          </div>
          <StatCard
            icon={Gift}
            label={t("referralBonus")}
            value={formatUSDCRounded(profile.referral_earnings)}
            gradient="accent"
          />
        </div>

        {/* Invite Code */}
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t("yourInviteCode")}</p>
              <p className="text-xl font-display font-bold text-primary">
                {profile.user_code}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={copyInviteCode}
              className="shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </GlassCard>

        {/* Referral CTA */}
        <Button
          onClick={() => navigate("/referral")}
          className="w-full gradient-primary h-14 text-lg font-semibold"
        >
          <Gift className="w-5 h-5 mr-2" />
          {t("referralInviteEarn")}
        </Button>

        {/* Intro Video */}
        <IntroVideoPlayer />

        {/* Announcements */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold">{t("news")}</h2>
          </div>
          {announcements.length > 0 ? (
            announcements.map((announcement) => (
              <GlassCard 
                key={announcement.id} 
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedAnnouncement(announcement)}
              >
                <div className="flex items-center gap-4">
                  {announcement.image_url && (
                    <img 
                      src={announcement.image_url} 
                      alt={announcement.title}
                      className="w-16 h-16 object-cover rounded-lg shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {announcement.content}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
              </GlassCard>
            ))
          ) : (
            <GlassCard className="p-3">
              <p className="text-sm text-muted-foreground">
                {t("noAnnouncements")}
              </p>
            </GlassCard>
          )}
        </div>

        {/* Announcement Modal - Custom Design */}
        <AnimatePresence>
          {selectedAnnouncement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedAnnouncement(null)}
            >
              {/* Backdrop with blur */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-md"
              />
              
              {/* Modal Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm max-h-[85vh] flex flex-col rounded-2xl overflow-hidden border border-border/50 shadow-2xl"
                style={{
                  background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--background)))',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(34, 211, 238, 0.1)'
                }}
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background/60 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Image with gradient overlay */}
                {selectedAnnouncement.image_url ? (
                  <div className="relative flex-shrink-0">
                    <img 
                      src={selectedAnnouncement.image_url} 
                      alt={selectedAnnouncement.title}
                      className="w-full h-52 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                    {/* Decorative glow */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1 rounded-full gradient-primary blur-md opacity-60" />
                  </div>
                ) : (
                  <div className="flex-shrink-0 h-20 relative overflow-hidden">
                    <div className="absolute inset-0 gradient-primary opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-primary opacity-50" />
                    </div>
                  </div>
                )}

                {/* Content - scrollable area */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y">
                  <div className="p-5 pb-8 space-y-4">
                    {/* Badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium gradient-primary text-primary-foreground">
                        <Megaphone className="w-3 h-3" />
                        {t("announcement")}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-display font-bold text-foreground leading-tight flex-shrink-0">
                      {selectedAnnouncement.title}
                    </h2>

                    {/* Divider */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="h-px flex-1 bg-gradient-to-r from-border via-primary/30 to-border" />
                      <Sparkles className="w-3 h-3 text-primary/50" />
                      <div className="h-px flex-1 bg-gradient-to-r from-border via-primary/30 to-border" />
                    </div>

                    {/* Description - vertical text with normal wrapping */}
                    <div className="text-sm text-muted-foreground leading-relaxed break-words pb-4">
                      {selectedAnnouncement.content}
                    </div>
                  </div>
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications Panel */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
              onClick={() => setShowNotifications(false)}
            >
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-md"
              />
              
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm max-h-[70vh] flex flex-col rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-card"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    <h2 className="font-display font-bold">{t("notifications")}</h2>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={markAllAsRead}
                      className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      title={t("markAllRead")}
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`p-4 transition-colors ${!notification.is_read ? 'bg-primary/5' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${!notification.is_read ? 'bg-primary' : 'bg-muted'}`} />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm">{notification.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                              <p className="text-xs text-muted-foreground/60 mt-2">
                                {new Date(notification.created_at).toLocaleDateString('it-IT', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Bell className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">{t("noNotifications")}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageLayout>
  );
};

export default Index;
