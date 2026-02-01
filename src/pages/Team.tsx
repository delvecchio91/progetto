import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatUSDCRounded, formatPower } from "@/lib/formatters";
import { motion } from "framer-motion";
import { Users, Zap, TrendingUp, Calendar, Cpu } from "lucide-react";

// Import centralized avatar utility
import { getAvatarByLevel } from "@/lib/avatars";

interface TeamMember {
  id: string;
  username: string | null;
  email: string;
  referral_level: string | null;
  total_computing_power: number;
  total_earnings: number;
  created_at: string;
  devices_count: number;
  active_devices_count: number;
}

interface TeamStats {
  totalMembers: number;
  totalPower: number;
  teamBonus: number;
}

const Team = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [userCode, setUserCode] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats>({ totalMembers: 0, totalPower: 0, teamBonus: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserCode();
    }
  }, [user]);

  useEffect(() => {
    if (userCode) {
      fetchTeamMembers();
    }
  }, [userCode]);

  const fetchUserCode = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_code")
      .eq("user_id", user!.id)
      .single();
    if (data) setUserCode(data.user_code);
  };

  const fetchTeamMembers = async () => {
    setLoading(true);
    
    // Fetch team members (profiles with inviter_code = user's code AND email verified)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, user_id, username, email, referral_level, total_computing_power, total_earnings, created_at, email_verified")
      .eq("inviter_code", userCode)
      .eq("email_verified", true)
      .order("created_at", { ascending: false });

    if (profiles && profiles.length > 0) {
      // Fetch device counts for each member
      const membersWithDevices = await Promise.all(
        profiles.map(async (profile) => {
          const { data: devices } = await supabase
            .from("user_devices")
            .select("id, status")
            .eq("user_id", profile.user_id);

          const devicesCount = devices?.length || 0;
          const activeDevicesCount = devices?.filter(d => d.status === "processing" || d.status === "active").length || 0;

          return {
            ...profile,
            devices_count: devicesCount,
            active_devices_count: activeDevicesCount,
          };
        })
      );

      setMembers(membersWithDevices);

      // Calculate stats
      const totalPower = membersWithDevices.reduce((sum, m) => sum + (m.total_computing_power || 0), 0);
      setStats({
        totalMembers: membersWithDevices.length,
        totalPower,
        teamBonus: 0, // Placeholder for future bonus calculation
      });
    } else {
      setMembers([]);
      setStats({ totalMembers: 0, totalPower: 0, teamBonus: 0 });
    }

    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageLayout 
      title={t("yourTeamTitle")} 
      subtitle={`${stats.totalMembers} ${stats.totalMembers === 1 ? t("person") : t("people")}`}
      showBack
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="p-4">
            <Users className="w-5 h-5 text-primary mb-2" />
            <p className="text-xs text-muted-foreground">{t("members")}</p>
            <p className="text-xl font-bold">{stats.totalMembers}</p>
          </GlassCard>
          <GlassCard className="p-4">
            <Zap className="w-5 h-5 text-purple-500 mb-2" />
            <p className="text-xs text-muted-foreground">{t("hashPower")}</p>
            <p className="text-xl font-bold">{stats.totalPower.toLocaleString()}</p>
          </GlassCard>
          <GlassCard className="p-4">
            <TrendingUp className="w-5 h-5 text-success mb-2" />
            <p className="text-xs text-muted-foreground">{t("teamBonus")}</p>
            <p className="text-xl font-bold">{stats.teamBonus}</p>
          </GlassCard>
        </div>

        {/* Team Members List */}
        <div className="space-y-3">
          {members.length > 0 ? (
            members.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={getAvatarByLevel(member.referral_level)}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full object-cover border-2 border-primary/30"
                      />
                      <div>
                        <h3 className="font-semibold">{member.username || 'Miner'}</h3>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    {member.active_devices_count > 0 ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-success/20 text-success border border-success/30">
                        {t("active")}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-muted/50 text-muted-foreground border border-muted-foreground/30">
                        {t("inactive")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    <Calendar className="w-3 h-3" />
                    <span>{t("registeredOn")} {formatDate(member.created_at)}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted/30 rounded-lg p-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <TrendingUp className="w-3 h-3 text-success" />
                        <span>{t("earnings")}</span>
                      </div>
                      <p className="font-bold text-sm">{formatUSDCRounded(member.total_earnings || 0)}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Zap className="w-3 h-3 text-purple-500" />
                        <span>{t("power")}</span>
                      </div>
                      <p className="font-bold text-sm">{formatPower(member.total_computing_power || 0)}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Cpu className="w-3 h-3 text-primary" />
                        <span>{t("devices")}</span>
                      </div>
                      <p className="font-bold text-sm">{member.active_devices_count} / {member.devices_count}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          ) : (
            <GlassCard className="p-6 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">{t("noTeamMembers")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("inviteNewUsers")}
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Team;
