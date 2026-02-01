import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { formatUSDC } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays, startOfDay } from "date-fns";

interface RentalStatusCardProps {
  userDeviceId: string;
  deviceName: string;
  devicePrice: number;
  purchasedAt: string | null;
  rentalExpiresAt: string | null;
  isRentalActive: boolean;
  onRenewalComplete: () => void;
}

export const RentalStatusCard = ({
  userDeviceId,
  deviceName,
  devicePrice,
  purchasedAt,
  rentalExpiresAt,
  isRentalActive,
  onRenewalComplete,
}: RentalStatusCardProps) => {
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!rentalExpiresAt) return null;

  const now = new Date();
  const expiryDate = new Date(rentalExpiresAt);
  const purchaseDate = purchasedAt ? new Date(purchasedAt) : null;
  
  // Use startOfDay for accurate day counting
  const todayStart = startOfDay(now);
  const expiryStart = startOfDay(expiryDate);
  const purchaseStart = purchaseDate ? startOfDay(purchaseDate) : null;
  
  // Calculate days remaining from today to expiry
  const daysRemaining = Math.max(0, differenceInDays(expiryStart, todayStart));
  
  // Calculate total days of rental period
  const totalDays = purchaseStart 
    ? differenceInDays(expiryStart, purchaseStart)
    : 365;
  
  // Calculate days used (from purchase to today)
  const daysUsed = purchaseStart 
    ? Math.max(0, differenceInDays(todayStart, purchaseStart))
    : 0;
  
  // Calculate progress percentage (clamped between 0-100)
  const progressPercentage = totalDays > 0 
    ? Math.min(100, Math.max(0, (daysUsed / totalDays) * 100))
    : 0;
  
  const isExpired = daysRemaining <= 0;
  const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;
  
  // Renewal cost = device price (for another year)
  const renewalCost = devicePrice;

  const handleRenewal = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error("Utente non autenticato");

      // Use secure server-side function for renewal
      const { data, error } = await supabase.rpc("renew_device_rental", {
        p_user_id: userData.user.id,
        p_user_device_id: userDeviceId,
      });

      if (error) {
        console.error("Renewal RPC error:", error);
        throw error;
      }

      // Type the response
      const result = data as {
        success: boolean;
        error?: string;
        required?: number;
        available?: number;
        new_expiry?: string;
        cost?: number;
        new_wallet_balance?: number;
      };

      if (!result?.success) {
        if (result?.error === "Insufficient wallet balance") {
          toast({
            title: "Saldo insufficiente",
            description: `Hai bisogno di ${formatUSDC(result.required || renewalCost)} per rinnovare. Saldo attuale: ${formatUSDC(result.available || 0)}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Errore",
            description: result?.error || "Errore durante il rinnovo",
            variant: "destructive",
          });
        }
        return;
      }

      const newExpiryDate = result.new_expiry ? new Date(result.new_expiry) : new Date();

      toast({
        title: "Rinnovo completato!",
        description: `${deviceName} è stato rinnovato fino al ${newExpiryDate.toLocaleDateString("it-IT")}`,
      });

      setShowRenewalDialog(false);
      onRenewalComplete();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      <GlassCard className={`p-4 ${isExpired ? "border-destructive/50 bg-destructive/5" : isExpiringSoon ? "border-warning/50 bg-warning/5" : ""}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isExpired ? "bg-destructive/20" : isExpiringSoon ? "bg-warning/20" : "bg-primary/20"
          }`}>
            {isExpired ? (
              <AlertTriangle className="w-4 h-4 text-destructive" />
            ) : (
              <Calendar className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-sm">Stato Noleggio</h3>
            {isExpired ? (
              <Badge variant="destructive" className="mt-1">Scaduto</Badge>
            ) : isExpiringSoon ? (
              <Badge className="bg-warning/20 text-warning border-warning/30 mt-1">
                Scade presto
              </Badge>
            ) : (
              <Badge className="bg-success/20 text-success border-success/30 mt-1">
                Attivo
              </Badge>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Durata noleggio</span>
            <span>{daysUsed} / {totalDays} giorni</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className={`h-2 ${isExpired ? "[&>div]:bg-destructive" : isExpiringSoon ? "[&>div]:bg-warning" : ""}`}
          />
        </div>

        {/* Dates info */}
        <div className="space-y-2 text-sm">
          {purchaseDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Acquistato il</span>
              <span className="font-medium">{formatDate(purchaseDate)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {isExpired ? "Scaduto il" : "Scade il"}
            </span>
            <span className={`font-medium ${isExpired ? "text-destructive" : isExpiringSoon ? "text-warning" : ""}`}>
              {formatDate(expiryDate)}
            </span>
          </div>
          {!isExpired && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Giorni rimanenti
              </span>
              <span className={`font-mono font-bold ${isExpiringSoon ? "text-warning" : "text-primary"}`}>
                {daysRemaining}
              </span>
            </div>
          )}
        </div>

        {/* Renewal button - show if expiring soon or expired */}
        {(isExpiringSoon || isExpired) && (
          <Button
            onClick={() => setShowRenewalDialog(true)}
            className={`w-full mt-4 ${isExpired ? "bg-destructive hover:bg-destructive/90" : "gradient-primary"}`}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {isExpired ? "Rinnova ora" : "Rinnova anticipatamente"}
          </Button>
        )}
      </GlassCard>

      {/* Renewal Dialog */}
      <AlertDialog open={showRenewalDialog} onOpenChange={setShowRenewalDialog}>
        <AlertDialogContent className="glass-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Rinnova noleggio
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vuoi rinnovare il noleggio di <strong>{deviceName}</strong> per un altro anno?
              <div className="mt-3 p-3 bg-background/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span>Costo rinnovo:</span>
                  <span className="font-mono font-bold text-foreground">{formatUSDC(renewalCost)}</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRenewal}
              disabled={loading}
              className="gradient-primary"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Rinnovo...
                </>
              ) : (
                "Conferma rinnovo"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
