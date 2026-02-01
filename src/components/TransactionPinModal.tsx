import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TransactionPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => Promise<boolean>;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export const TransactionPinModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading = false,
}: TransactionPinModalProps) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (pin.length !== 6) {
      setError("Il PIN deve essere di 6 cifre");
      return;
    }

    setError("");
    const success = await onConfirm(pin);
    
    if (!success) {
      setError("PIN non corretto");
      setPin("");
    } else {
      setPin("");
      onClose();
    }
  };

  const handleClose = () => {
    setPin("");
    setError("");
    onClose();
  };

  const handleForgotPin = async () => {
    setSendingReset(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-pin-reset");
      
      if (error) throw error;
      
      toast({
        title: "Email inviata!",
        description: "Controlla la tua email per reimpostare il PIN. Se non la trovi, controlla nella cartella Spam.",
      });
      handleClose();
    } catch (error: any) {
      console.error("Error sending reset email:", error);
      toast({
        title: "Errore",
        description: "Impossibile inviare l'email di reset. Riprova.",
        variant: "destructive",
      });
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            {title || "Inserisci PIN di sicurezza"}
          </DialogTitle>
          <DialogDescription>
            {description || "Inserisci il tuo PIN a 6 cifre per confermare l'operazione"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative">
            <InputOTP
              maxLength={6}
              value={pin}
              onChange={setPin}
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
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading || sendingReset}
            >
              Annulla
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1"
              disabled={pin.length !== 6 || isLoading || sendingReset}
            >
              {isLoading ? "Verifica..." : "Conferma"}
            </Button>
          </div>

          <button
            type="button"
            onClick={handleForgotPin}
            disabled={sendingReset || isLoading}
            className="text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            {sendingReset ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Invio email...
              </span>
            ) : (
              "Hai dimenticato il PIN?"
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
