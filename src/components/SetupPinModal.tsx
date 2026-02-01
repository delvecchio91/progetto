import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Lock, Eye, EyeOff, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SetupPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SetupPinModal = ({
  isOpen,
  onClose,
  onSuccess,
}: SetupPinModalProps) => {
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleNext = () => {
    if (pin.length !== 6) {
      setError("Il PIN deve essere di 6 cifre");
      return;
    }
    setError("");
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (confirmPin !== pin) {
      setError("I PIN non corrispondono");
      setConfirmPin("");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.rpc('set_transaction_pin', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_pin: pin
      });

      if (error) throw error;

      toast({
        title: "PIN impostato!",
        description: "Il tuo PIN di sicurezza è stato configurato correttamente.",
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error("Error setting PIN:", error);
      setError("Errore durante l'impostazione del PIN");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPin("");
    setConfirmPin("");
    setError("");
    setStep("create");
    onClose();
  };

  const handleBack = () => {
    setConfirmPin("");
    setError("");
    setStep("create");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {step === "create" ? "Crea PIN di sicurezza" : "Conferma PIN"}
          </DialogTitle>
          <DialogDescription>
            {step === "create" 
              ? "Crea un PIN a 6 cifre per proteggere le tue transazioni (acquisti e prelievi)"
              : "Reinserisci il PIN per confermare"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
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

          <div className="flex gap-3 w-full">
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
              className="flex-1"
              disabled={(step === "create" ? pin.length !== 6 : confirmPin.length !== 6) || isLoading}
            >
              {isLoading ? "Salvataggio..." : step === "create" ? "Avanti" : "Conferma"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Questo PIN sarà richiesto per ogni acquisto e prelievo
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
