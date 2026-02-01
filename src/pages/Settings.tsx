import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogOut, MessageCircle, Save, Info, Smartphone } from "lucide-react";
import { useInstallPWA } from "@/hooks/useInstallPWA";
import { getAvatarByLevel } from "@/lib/avatars";
import type { ProfileWithPosition } from "@/types/profile";

const Settings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<ProfileWithPosition | null>(null);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canInstall, isIOS, isAndroid, isStandalone, promptInstall, resetModalDismissed } = useInstallPWA();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfileWithLevel();
    }
  }, [user]);

  const fetchProfileWithLevel = async () => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single();
    
    if (profileData) {
      setProfile(profileData);
      setUsername(profileData.username || "");

      // Fetch position title from referral_levels
      const { data: levelData } = await supabase
        .from("referral_levels")
        .select("position_title")
        .eq("name", profileData.referral_level || "bronze")
        .maybeSingle();
      
      if (levelData?.position_title) {
        setProfile((prev) => prev ? { ...prev, position_title: levelData.position_title } : prev);
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: t("saved"),
        description: t("settingsUpdated"),
      });
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || t("saveError"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const openWhatsApp = () => {
    window.open("https://wa.me/393775509088", "_blank");
  };

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentLevelAvatar = getAvatarByLevel(profile?.referral_level);

  return (
    <PageLayout title={t("settingsTitle")} showBack>
      <div className="space-y-6 pb-24">
        {/* Current Level Avatar Preview */}
        <div className="flex flex-col items-center py-4">
          <div className="w-28 h-28 rounded-full border-2 border-primary/30 overflow-hidden mb-3 shadow-lg shadow-primary/20">
            <img 
              src={currentLevelAvatar} 
              alt={t("avatarOfLevel")}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-muted-foreground text-sm">{t("avatarOfLevel")}</p>
          {profile?.position_title && (
            <span className="mt-2 px-3 py-1 text-sm font-semibold rounded-full bg-primary/20 text-primary border border-primary/30">
              {profile.position_title}
            </span>
          )}
        </div>

        {/* Profile Name */}
        <GlassCard className="p-4">
          <Label htmlFor="username" className="text-sm text-muted-foreground mb-2 block">
            {t("profileName")}
          </Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("enterYourName")}
            className="bg-background/50"
          />
        </GlassCard>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 font-semibold"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              {t("saveChanges")}
            </>
          )}
        </Button>

        {/* WhatsApp Contact */}
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground text-center mb-3">
            {t("needHelp")}
          </p>
          <Button
            variant="outline"
            onClick={openWhatsApp}
            className="w-full h-12 border-success/30 hover:bg-success/10"
          >
            <MessageCircle className="w-5 h-5 mr-2 text-success" />
            <span>{t("contactWhatsApp")}</span>
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            +39 377 550 9088
          </p>
        </GlassCard>

        {/* About Us Link */}
        <GlassCard className="p-4">
          <Button
            variant="outline"
            onClick={() => navigate("/about")}
            className="w-full h-12"
          >
            <Info className="w-5 h-5 mr-2" />
            {t("aboutUs")}
          </Button>
        </GlassCard>

        {/* Install App Button - only show if not already installed */}
        {!isStandalone && (isIOS || isAndroid || canInstall) && (
          <GlassCard className="p-4">
            <p className="text-sm text-muted-foreground text-center mb-3">
              {t("installAppDesc")}
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/install")}
              className="w-full h-12 border-primary/30 hover:bg-primary/10"
            >
              <Smartphone className="w-5 h-5 mr-2 text-primary" />
              <span>{t("installApp")}</span>
            </Button>
          </GlassCard>
        )}

        {/* Logout Button */}
        <Button
          variant="destructive"
          onClick={async () => {
            await signOut();
            navigate("/auth");
          }}
          className="w-full h-12 font-semibold"
        >
          <LogOut className="w-5 h-5 mr-2" />
          {t("logout")}
        </Button>
      </div>
    </PageLayout>
  );
};

export default Settings;
