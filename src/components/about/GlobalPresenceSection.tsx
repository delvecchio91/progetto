import { motion } from "framer-motion";
import { Globe, Building2, Users, MapPin } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";

// Animated counter hook
const useCounter = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
};

interface StatCardProps {
  value: number;
  suffix?: string;
  label: string;
  icon: React.ReactNode;
  delay?: number;
  gradient: string;
}

const StatCard = ({ value, suffix = "", label, icon, delay = 0, gradient }: StatCardProps) => {
  const count = useCounter(value, 2000);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`relative overflow-hidden rounded-2xl p-4 ${gradient}`}
    >
      <div className="absolute top-2 right-2 opacity-20">
        {icon}
      </div>
      <div className="relative z-10">
        <div className="text-3xl font-bold font-display">
          {count}{suffix}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </motion.div>
  );
};

interface CountryGroup {
  emoji: string;
  region: string;
  countries: Array<{ name: string; isHQ?: boolean; isEuropeHQ?: boolean }>;
}

const GlobalPresenceSection = () => {
  const { t } = useLanguage();

  const countryGroups: CountryGroup[] = [
    {
      emoji: "🌏",
      region: t("regionAsiaPacific"),
      countries: [
        { name: "Singapore", isHQ: true },
        { name: t("countryJapan") },
        { name: t("countrySouthKorea") },
        { name: t("countryAustralia") },
        { name: t("countryIndia") },
        { name: t("countryHongKong") },
      ]
    },
    {
      emoji: "🇪🇺",
      region: t("regionEurope"),
      countries: [
        { name: t("countryItaly"), isEuropeHQ: true },
        { name: t("countryGermany") },
        { name: t("countryFrance") },
        { name: t("countrySpain") },
        { name: t("countryUK") },
        { name: t("countrySwitzerland") },
        { name: t("countryNetherlands") },
        { name: t("countryPortugal") },
      ]
    },
    {
      emoji: "🌎",
      region: t("regionAmericas"),
      countries: [
        { name: t("countryUSA") },
        { name: t("countryCanada") },
        { name: t("countryBrazil") },
        { name: t("countryMexico") },
        { name: t("countryArgentina") },
      ]
    },
    {
      emoji: "🌍",
      region: t("regionMiddleEastAfrica"),
      countries: [
        { name: t("countryUAE") },
        { name: t("countrySaudiArabia") },
        { name: t("countrySouthAfrica") },
        { name: t("countryNigeria") },
        { name: t("countryIsrael") },
      ]
    }
  ];

  return (
    <GlassCard className="p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
          <Globe className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg">{t("globalPresenceTitle")}</h2>
          <p className="text-xs text-muted-foreground">{t("globalPresenceSubtitle")}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          value={24}
          label={t("statCountries")}
          icon={<Globe className="w-8 h-8" />}
          delay={0}
          gradient="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20"
        />
        <StatCard
          value={50}
          suffix="+"
          label={t("statOffices")}
          icon={<Building2 className="w-8 h-8" />}
          delay={0.1}
          gradient="bg-gradient-to-br from-accent/20 via-accent/10 to-transparent border border-accent/20"
        />
        <StatCard
          value={1}
          suffix="M+"
          label={t("statUsers")}
          icon={<Users className="w-8 h-8" />}
          delay={0.2}
          gradient="bg-gradient-to-br from-success/20 via-success/10 to-transparent border border-success/20"
        />
      </div>

      {/* Countries by Region */}
      <div className="space-y-4">
        {countryGroups.map((group, groupIndex) => (
          <motion.div
            key={group.region}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 * groupIndex }}
            className="bg-muted/30 rounded-xl p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{group.emoji}</span>
              <span className="font-semibold text-sm">{group.region}</span>
              <span className="text-xs text-muted-foreground">({group.countries.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.countries.map((country, idx) => (
                <span
                  key={idx}
                  className={`text-xs px-2 py-1 rounded-lg ${
                    country.isHQ 
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold" 
                      : country.isEuropeHQ
                      ? "bg-gradient-to-r from-green-500/30 to-emerald-500/30 border border-green-500/40 text-foreground font-medium"
                      : "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {country.name}
                  {country.isHQ && (
                    <span className="ml-1 text-[10px]">🏛️ HQ</span>
                  )}
                  {country.isEuropeHQ && (
                    <span className="ml-1 text-[10px]">🇮🇹</span>
                  )}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer note */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"
      >
        <MapPin className="w-3 h-3" />
        <span>{t("globalPresenceNote")}</span>
      </motion.div>
    </GlassCard>
  );
};

export default GlobalPresenceSection;
