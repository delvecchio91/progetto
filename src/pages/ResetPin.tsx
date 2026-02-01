import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, AlertTriangle, Eye, EyeOff, Shield } from "lucide-react";

const ResetPin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        // Check if token exists and is valid (we can't query directly due to RLS, but the reset function will validate)
        // Just check if token looks valid
        if (token.length > 10) {
          setTokenValid(true);
        }
      } catch (error) {
        console.error("Token validation error:", error);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleNext = () => {
    if (pin.length !== 6) {
      setError("Il PIN deve essere di 6 cifre");
      return;
    }
    setError("");
    setStep("confirm");
  };

  const handleBack = () => {
    setConfirmPin("");
    setError("");
    setStep("create");
  };

  const handleConfirm = async () => {
    if (confirmPin !== pin) {
      setError("I PIN non corrispondono");
      setConfirmPin("");
      return;
    }

    if (!token) {
      setError("Token mancante");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.rpc("reset_pin_with_token", {
        p_token: token,
        p_new_pin: pin,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      
      if (!result.success) {
        throw new Error(result.error || "Errore nel reset del PIN");
      }

      setSuccess(true);
      toast({
        title: "PIN reimpostato!",
        description: "Il tuo nuovo PIN è stato configurato correttamente.",
      });

    } catch (error: any) {
      console.error("Error resetting PIN:", error);
      setError(error.message || "Errore nel reset del PIN");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <PageLayout title="Reset PIN">
        <GlassCard className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Link non valido</h2>
          <p className="text-muted-foreground mb-4">
            Il link per reimpostare il PIN non è valido o è scaduto.
          </p>
          <Button onClick={() => navigate("/")}>
            Torna alla Home
          </Button>
        </GlassCard>
      </PageLayout>
    );
  }

  if (success) {
    return (
      <PageLayout title="Reset PIN">
        <GlassCard className="text-center py-8">
          <div className="w-16 h-16 rounded-full gradient-primary mx-auto mb-4 flex items-center justify-center">
            <Check className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-display font-bold mb-2">PIN Reimpostato!</h2>
          <p className="text-muted-foreground mb-6">
            Il tuo nuovo PIN è stato configurato. Puoi ora usarlo per acquisti e prelievi.
          </p>
          <Button onClick={() => navigate("/wallet")} className="gradient-primary">
            Vai al Wallet
          </Button>
        </GlassCard>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Reimposta PIN">
      <div className="space-y-6">
        <GlassCard className="text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">
            {step === "create" ? "Crea nuovo PIN" : "Conferma PIN"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {step === "create" 
              ? "Inserisci un nuovo PIN a 6 cifre"
              : "Reinserisci il PIN per confermare"
            }
          </p>

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <InputOTP
                maxLength={6}
                value={step === "create" ? pin : confirmPin}
                onChange={step === "create" ? setPin : setConfirmPin}
                disabled={isLoading}
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot 
                      key={index} 
                      index={index}
                      className={showPin ? "" : "text-security"}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute -right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-3 w-full max-w-xs">
              {step === "confirm" && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Indietro
                </Button>
              )}
              <Button
                onClick={step === "create" ? handleNext : handleConfirm}
                className="flex-1 gradient-primary"
                disabled={(step === "create" ? pin.length !== 6 : confirmPin.length !== 6) || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : step === "create" ? (
                  "Avanti"
                ) : (
                  "Conferma"
                )}
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageLayout>
  );
};

export default ResetPin;
