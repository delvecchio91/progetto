import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";

const VerifyEmail = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");
      
      if (!token) {
        setStatus("error");
        setMessage(t("verificationTokenMissing") || "Token di verifica mancante");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-email", {
          body: { token },
        });

        if (error || !data?.success) {
          setStatus("error");
          setMessage(data?.error || error?.message || t("verificationFailed") || "Verifica fallita");
          return;
        }

        setStatus("success");
        setMessage(data.message || t("emailVerified") || "Email verificata con successo!");
      } catch (error: any) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage(error.message || t("verificationFailed") || "Verifica fallita");
      }
    };

    verifyToken();
  }, [searchParams, t]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center space-y-2">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
            status === "loading" ? "bg-primary/20" :
            status === "success" ? "bg-green-500/20" :
            "bg-destructive/20"
          }`}>
            {status === "loading" && <Loader2 className="w-8 h-8 text-primary animate-spin" />}
            {status === "success" && <CheckCircle2 className="w-8 h-8 text-green-500" />}
            {status === "error" && <XCircle className="w-8 h-8 text-destructive" />}
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {status === "loading" && (t("verifyingEmail") || "Verifica email...")}
            {status === "success" && (t("emailVerifiedTitle") || "Email verificata!")}
            {status === "error" && (t("verificationErrorTitle") || "Errore di verifica")}
          </h1>
        </div>

        <GlassCard className="p-6 text-center space-y-4">
          <p className={`${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
            {message}
          </p>
          
          {status === "success" && (
            <p className="text-sm text-muted-foreground">
              {t("canNowLogin") || "Ora puoi effettuare il login con la tua email."}
            </p>
          )}
        </GlassCard>

        <Button
          className="w-full gradient-primary"
          onClick={() => navigate("/auth?mode=login")}
        >
          <Mail className="w-4 h-4 mr-2" />
          {t("goToLogin") || "Vai al Login"}
        </Button>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
