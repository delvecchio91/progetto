import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Cpu, Zap, TrendingUp, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const Welcome = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  // Redirect authenticated users to home
  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Zap,
      label: t("highPower"),
      color: "text-yellow-400",
    },
    {
      icon: TrendingUp,
      label: t("returns"),
      color: "text-green-400",
    },
    {
      icon: Users,
      label: t("teamBonus"),
      color: "text-primary",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md space-y-8 text-center"
      >
        {/* Logo Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex justify-center"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/30 flex items-center justify-center shadow-lg">
            <Cpu className="w-12 h-12 text-primary" />
          </div>
        </motion.div>

        {/* Brand Name */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h1 className="text-4xl font-display font-bold">
            <span className="text-primary">i</span>
            <span className="text-foreground">Core</span>
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-muted-foreground text-lg px-4"
        >
          {t("futureOfMining")}
        </motion.p>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex justify-center gap-4 px-2"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.15, duration: 0.5, type: "spring" }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="flex-1 relative group"
            >
              {/* Glow effect */}
              <div 
                className={`absolute inset-0 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 ${
                  index === 0 ? "bg-yellow-400" : index === 1 ? "bg-green-400" : "bg-primary"
                }`}
              />
              
              {/* Card */}
              <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl rounded-2xl p-5 border border-white/10 flex flex-col items-center gap-3 overflow-hidden">
                {/* Icon container with gradient background */}
                <div 
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    index === 0 
                      ? "bg-gradient-to-br from-yellow-400/20 to-orange-500/20" 
                      : index === 1 
                        ? "bg-gradient-to-br from-green-400/20 to-emerald-500/20" 
                        : "bg-gradient-to-br from-primary/20 to-accent/20"
                  }`}
                >
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                
                <span className="text-xs text-foreground/80 font-semibold tracking-wide text-center">
                  {feature.label}
                </span>
                
                {/* Decorative corner accent */}
                <div 
                  className={`absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-20 ${
                    index === 0 ? "bg-yellow-400" : index === 1 ? "bg-green-400" : "bg-primary"
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="space-y-3 pt-4"
        >
          <Button
            onClick={() => navigate("/auth?mode=register")}
            className="w-full h-14 text-lg font-semibold rounded-xl"
            style={{
              background: "linear-gradient(135deg, hsl(185, 85%, 50%), hsl(280, 70%, 55%))",
            }}
          >
            {t("startNow")}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <Button
            onClick={() => navigate("/auth?mode=login")}
            variant="outline"
            className="w-full h-14 text-lg font-medium rounded-xl border-primary/30 hover:bg-primary/10"
          >
            {t("alreadyHaveAccount")}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Welcome;
