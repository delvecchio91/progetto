import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { 
  Shield, Users, Cpu, ArrowLeftRight, Megaphone, 
  ArrowLeft, Loader2, Settings, Clock, Gift, ClipboardList, Sparkles, DollarSign
} from "lucide-react";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminDevices } from "@/components/admin/AdminDevices";
import { AdminTransactions } from "@/components/admin/AdminTransactions";
import { AdminAnnouncements } from "@/components/admin/AdminAnnouncements";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminDurations } from "@/components/admin/AdminDurations";
import { AdminGiftDevice } from "@/components/admin/AdminGiftDevice";
import { AdminTasks } from "@/components/admin/AdminTasks";
import { AdminFortuneWheel } from "@/components/admin/AdminFortuneWheel";
import { AdminCreditUsdc } from "@/components/admin/AdminCreditUsdc";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .rpc("has_role", { _user_id: user.id, _role: "admin" });

      if (!error && data) {
        setIsAdmin(true);
      }
      setLoading(false);
    };

    if (!authLoading) {
      checkAdminRole();
    }
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <GlassCard className="p-8 text-center max-w-md">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Accesso Negato</h1>
          <p className="text-muted-foreground mb-6">
            Non hai i permessi per accedere a questa pagina.
          </p>
          <Button onClick={() => navigate("/")} className="gradient-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Home
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass-card border-b border-border/50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">Gestione piattaforma</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 pb-8">
        <Tabs defaultValue="users" className="space-y-6">
          <div className="space-y-2">
            <TabsList className="grid grid-cols-5 gap-1 bg-card/50 p-1.5 rounded-xl">
              <TabsTrigger 
                value="users" 
                className="flex items-center justify-center gap-1.5 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground rounded-lg py-2 text-xs"
              >
                <Users className="w-4 h-4" />
                <span className="hidden md:inline">Utenti</span>
              </TabsTrigger>
              <TabsTrigger 
                value="devices"
                className="flex items-center justify-center gap-1.5 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground rounded-lg py-2 text-xs"
              >
                <Cpu className="w-4 h-4" />
                <span className="hidden md:inline">Dispositivi</span>
              </TabsTrigger>
              <TabsTrigger 
                value="tasks"
                className="flex items-center justify-center gap-1.5 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground rounded-lg py-2 text-xs"
              >
                <ClipboardList className="w-4 h-4" />
                <span className="hidden md:inline">Compiti</span>
              </TabsTrigger>
              <TabsTrigger 
                value="durations"
                className="flex items-center justify-center gap-1.5 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground rounded-lg py-2 text-xs"
              >
                <Clock className="w-4 h-4" />
                <span className="hidden md:inline">Durate</span>
              </TabsTrigger>
              <TabsTrigger 
                value="transactions"
                className="flex items-center justify-center gap-1.5 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground rounded-lg py-2 text-xs"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span className="hidden md:inline">Transazioni</span>
              </TabsTrigger>
            </TabsList>
            <TabsList className="grid grid-cols-5 gap-1 bg-card/50 p-1.5 rounded-xl">
              <TabsTrigger 
                value="gifts"
                className="flex items-center justify-center gap-1.5 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground rounded-lg py-2 text-xs"
              >
                <Gift className="w-4 h-4" />
                <span className="hidden md:inline">Regali</span>
              </TabsTrigger>
              <TabsTrigger 
                value="credit"
                className="flex items-center justify-center gap-1.5 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground rounded-lg py-2 text-xs"
              >
                <DollarSign className="w-4 h-4" />
                <span className="hidden md:inline">Accredita</span>
              </TabsTrigger>
              <TabsTrigger 
                value="fortune"
                className="flex items-center justify-center gap-1.5 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground rounded-lg py-2 text-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden md:inline">Ruota</span>
              </TabsTrigger>
              <TabsTrigger 
                value="announcements"
                className="flex items-center justify-center gap-1.5 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground rounded-lg py-2 text-xs"
              >
                <Megaphone className="w-4 h-4" />
                <span className="hidden md:inline">Annunci</span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="flex items-center justify-center gap-1.5 data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground rounded-lg py-2 text-xs"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">Impostazioni</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="devices">
            <AdminDevices />
          </TabsContent>

          <TabsContent value="tasks">
            <AdminTasks />
          </TabsContent>

          <TabsContent value="durations">
            <AdminDurations />
          </TabsContent>

          <TabsContent value="transactions">
            <AdminTransactions />
          </TabsContent>

          <TabsContent value="gifts">
            <AdminGiftDevice />
          </TabsContent>

          <TabsContent value="credit">
            <AdminCreditUsdc />
          </TabsContent>

          <TabsContent value="fortune">
            <AdminFortuneWheel />
          </TabsContent>

          <TabsContent value="announcements">
            <AdminAnnouncements />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
