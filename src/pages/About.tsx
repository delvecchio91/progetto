import { PageLayout } from "@/components/layout/PageLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Users, Target, Heart, Mail, Phone, 
  MessageCircle, Globe, Shield, Zap, Award, HelpCircle, ChevronDown, X, MapPin
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import GlobalPresenceSection from "@/components/about/GlobalPresenceSection";

// Certificati 2023
import certCanada from "@/assets/certificates/icore-canada-partnership-2023.webp";
import certExcellence from "@/assets/certificates/icore-excellence-2023.webp";
import certIncorporation from "@/assets/certificates/icore-incorporation-2023.webp";
import certInvestor from "@/assets/certificates/icore-investor-2023.webp";
import certLicense from "@/assets/certificates/icore-license-2023.webp";
import certMexico from "@/assets/certificates/icore-mexico-partnership-2023.webp";
import certPartnership from "@/assets/certificates/icore-partnership-2023.webp";
import certUSA from "@/assets/certificates/icore-usa-partnership-2023.webp";

const certificates2023 = [
  { src: certIncorporation, title: "Incorporation Certificate" },
  { src: certLicense, title: "Business License" },
  { src: certExcellence, title: "Excellence Award" },
  { src: certInvestor, title: "Investor Certificate" },
  { src: certPartnership, title: "Partnership Certificate" },
  { src: certUSA, title: "USA Partnership" },
  { src: certCanada, title: "Canada Partnership" },
  { src: certMexico, title: "Mexico Partnership" },
];

const CertificatesSection = () => {
  const { t } = useLanguage();
  const [selectedCert, setSelectedCert] = useState<{ src: string; title: string } | null>(null);

  return (
    <>
      <GlassCard className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <h2 className="font-display font-bold text-lg">{t("certificationsTitle")}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {t("certificationsDesc")}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {certificates2023.map((cert, index) => (
            <motion.button
              key={index}
              onClick={() => setSelectedCert(cert)}
              className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted/30 border border-border/50 hover:border-primary/50 transition-all group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <img 
                src={cert.src} 
                alt={cert.title}
                className="w-full h-full object-cover group-hover:brightness-110 transition-all"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                <p className="text-[10px] text-white font-medium text-center truncate">
                  {cert.title}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </GlassCard>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedCert(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-lg w-full max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedCert(null)}
                className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <img
                src={selectedCert.src}
                alt={selectedCert.title}
                className="w-full h-full object-contain rounded-xl"
              />
              <p className="text-center text-white font-medium mt-3">
                {selectedCert.title}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const FAQSection = () => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    { question: t("faq1Q"), answer: t("faq1A") },
    { question: t("faq2Q"), answer: t("faq2A") },
    { question: t("faq3Q"), answer: t("faq3A") },
    { question: t("faq4Q"), answer: t("faq4A") },
    { question: t("faq5Q"), answer: t("faq5A") },
    { question: t("faq6Q"), answer: t("faq6A") },
    { question: t("faq7Q"), answer: t("faq7A") },
    { question: t("faq8Q"), answer: t("faq8A") },
  ];

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
        </div>
        <h2 className="font-display font-bold text-lg">{t("faqTitle")}</h2>
      </div>
      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <div 
            key={index}
            className="bg-muted/30 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <span className="font-medium text-sm pr-2">{faq.question}</span>
              <ChevronDown 
                className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                  openIndex === index ? "rotate-180" : ""
                }`} 
              />
            </button>
            <motion.div
              initial={false}
              animate={{
                height: openIndex === index ? "auto" : 0,
                opacity: openIndex === index ? 1 : 0
              }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed">
                {faq.answer}
              </p>
            </motion.div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

const About = () => {
  const { t } = useLanguage();

  const openWhatsApp = () => {
    window.open("https://wa.me/393775509088", "_blank");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <PageLayout title={t("aboutUs")} showBack>
      <motion.div 
        className="space-y-6 pb-24"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-6 text-center">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">iCore</h1>
            <p className="text-muted-foreground">
              {t("aboutHeroDesc")}
            </p>
          </GlassCard>
        </motion.div>

        {/* Storia Aziendale */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-display font-bold text-lg">{t("ourStory")}</h2>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>{t("ourStoryP1")}</p>
              <p>{t("ourStoryP2")}</p>
              <p>{t("ourStoryP3")}</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Valori e Visione */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-accent" />
              </div>
              <h2 className="font-display font-bold text-lg">{t("ourValues")}</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{t("valueSecurity")}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t("valueSecurityDesc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{t("valueInnovation")}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t("valueInnovationDesc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Heart className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{t("valueTransparency")}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t("valueTransparencyDesc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Award className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{t("valueExcellence")}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t("valueExcellenceDesc")}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Team */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-success" />
              </div>
              <h2 className="font-display font-bold text-lg">{t("ourTeam")}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {t("ourTeamDesc")}
            </p>
            <div className="space-y-3">
              <div className="bg-muted/30 rounded-xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">👨‍💻</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{t("teamDev")}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("teamDevDesc")}
                  </p>
                </div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🛡️</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{t("teamSecurity")}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("teamSecurityDesc")}
                  </p>
                </div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">💬</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{t("teamSupport")}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("teamSupportDesc")}
                  </p>
                </div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📈</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{t("teamOps")}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("teamOpsDesc")}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Certificazioni e Partnership */}
        <motion.div variants={itemVariants}>
          <CertificatesSection />
        </motion.div>

        {/* Presenza Globale */}
        <motion.div variants={itemVariants}>
          <GlobalPresenceSection />
        </motion.div>

        {/* FAQ */}
        <motion.div variants={itemVariants}>
          <FAQSection />
        </motion.div>

        {/* Contatti */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-warning" />
              </div>
              <h2 className="font-display font-bold text-lg">{t("contactUs")}</h2>
            </div>
            <div className="space-y-4 mb-4">
              {/* Sede */}
              <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent rounded-xl p-4 border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{t("headquarters")}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      iCore Technologies Ltd.<br />
                      Marina Bay Financial Centre, Tower 3<br />
                      12 Marina Boulevard, Level 28<br />
                      Singapore 018982
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Email e Telefono */}
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>support@icoremining.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>+39 377 550 9088</span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={openWhatsApp}
              className="w-full h-12 border-success/30 hover:bg-success/10"
            >
              <MessageCircle className="w-5 h-5 mr-2 text-success" />
              <span>{t("writeOnWhatsApp")}</span>
            </Button>
          </GlassCard>
        </motion.div>
      </motion.div>
    </PageLayout>
  );
};

export default About;