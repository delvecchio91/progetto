import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { useInstallPWA } from "@/hooks/useInstallPWA";
import { toast } from "sonner";
import { 
  Smartphone, 
  Share, 
  MoreVertical, 
  PlusSquare, 
  Download, 
  CheckCircle2,
  ArrowRight,
  Apple,
  Chrome,
  Copy,
  ExternalLink,
  AlertTriangle
} from "lucide-react";

const Install = () => {
  const navigate = useNavigate();
  const { canInstall, isIOS, isAndroid, isStandalone, isIOSChrome, promptInstall } = useInstallPWA();
  const [copied, setCopied] = useState(false);

  // If already installed, redirect to home
  useEffect(() => {
    if (isStandalone) {
      navigate("/");
    }
  }, [isStandalone, navigate]);

  const handleDirectInstall = async () => {
    if (canInstall) {
      const installed = await promptInstall();
      if (installed) {
        navigate("/");
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      toast.success("Link copiato! Aprilo in Safari");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Impossibile copiare il link");
    }
  };

  return (
    <PageLayout title="Installa App" showBack>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="text-center py-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <Smartphone className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Installa iCore</h1>
          <p className="text-muted-foreground">
            Aggiungi l'app alla schermata home per un accesso rapido
          </p>
        </div>

        {/* Benefits */}
        <GlassCard className="p-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            Vantaggi dell'installazione
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              <span className="text-sm">Accesso rapido dalla schermata home</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              <span className="text-sm">Esperienza a schermo intero senza barra del browser</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              <span className="text-sm">Caricamento più veloce delle pagine</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              <span className="text-sm">Non occupa spazio come un'app tradizionale</span>
            </li>
          </ul>
        </GlassCard>

        {/* Direct Install Button (Android/Chrome) */}
        {canInstall && (
          <Button
            onClick={handleDirectInstall}
            className="w-full h-14 text-lg font-semibold"
          >
            <Download className="w-6 h-6 mr-2" />
            Installa Ora
          </Button>
        )}

        {/* iOS Chrome/Firefox Instructions */}
        {isIOSChrome && (
          <GlassCard className="p-4 border-orange-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                <Chrome className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-semibold">Istruzioni per Chrome su iOS</h2>
                <p className="text-xs text-muted-foreground">iPhone/iPad</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-bold text-primary">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2">Tocca il pulsante Condividi</p>
                  <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-center">
                    <Share className="w-8 h-8 text-orange-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Si trova in alto a destra
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-bold text-primary">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2">Tocca "Altro..."</p>
                  <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                    <MoreVertical className="w-6 h-6 text-orange-500" />
                    <span className="text-sm">Altro...</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Scorri le opzioni fino a trovarlo
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-bold text-primary">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2">Seleziona "Aggiungi alla schermata Home"</p>
                  <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                    <PlusSquare className="w-6 h-6 text-orange-500" />
                    <span className="text-sm">Aggiungi alla schermata Home</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-bold text-primary">
                  4
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2">Conferma toccando "Aggiungi"</p>
                  <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-center">
                    <span className="text-orange-500 font-semibold">Aggiungi</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    L'app apparirà sulla tua schermata home
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* iOS Instructions (Safari) */}
        {isIOS && !isIOSChrome && (
          <GlassCard className="p-4 border-blue-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                <Apple className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-semibold">Istruzioni per iPhone/iPad</h2>
                <p className="text-xs text-muted-foreground">Safari Browser</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-bold text-primary">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2">Tocca il pulsante Condividi</p>
                  <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-center">
                    <Share className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Si trova nella barra in basso di Safari
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-bold text-primary">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2">Tocca "Altro..."</p>
                  <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                    <MoreVertical className="w-6 h-6 text-blue-500" />
                    <span className="text-sm">Altro...</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Scorri le opzioni fino a trovarlo
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-bold text-primary">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2">Seleziona "Aggiungi alla schermata Home"</p>
                  <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                    <PlusSquare className="w-6 h-6 text-blue-500" />
                    <span className="text-sm">Aggiungi alla schermata Home</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-bold text-primary">
                  4
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2">Conferma toccando "Aggiungi"</p>
                  <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-center">
                    <span className="text-blue-500 font-semibold">Aggiungi</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    L'app apparirà sulla tua schermata home
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Android Instructions */}
        {isAndroid && !canInstall && (
          <GlassCard className="p-4 border-green-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                <Chrome className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-semibold">Istruzioni per Android</h2>
                <p className="text-xs text-muted-foreground">Chrome Browser</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-bold text-primary">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2">Tocca il menu (tre puntini)</p>
                  <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-center">
                    <MoreVertical className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Si trova nell'angolo in alto a destra
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-bold text-primary">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2">Seleziona "Installa app" o "Aggiungi a schermata Home"</p>
                  <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                    <Download className="w-6 h-6 text-green-500" />
                    <span className="text-sm">Installa app</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-bold text-primary">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2">Conferma l'installazione</p>
                  <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-center">
                    <span className="text-green-500 font-semibold">Installa</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    L'app verrà aggiunta alla schermata home
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Desktop/Generic Instructions */}
        {!isIOS && !isAndroid && !canInstall && (
          <GlassCard className="p-4">
            <h2 className="font-semibold mb-4">Come installare</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Per installare l'app, usa un browser compatibile come Chrome, Edge o Safari e cerca l'opzione "Installa" o "Aggiungi alla schermata Home" nel menu del browser.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm">
                💡 Consiglio: Visita questo sito dal tuo smartphone per la migliore esperienza
              </p>
            </div>
          </GlassCard>
        )}

        {/* Help Section */}
        <GlassCard className="p-4 bg-muted/30">
          <h3 className="font-medium mb-2">Hai bisogno di aiuto?</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Se riscontri problemi durante l'installazione, contattaci su WhatsApp.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("https://wa.me/393775509088", "_blank")}
          >
            Contatta Supporto
          </Button>
        </GlassCard>
      </div>
    </PageLayout>
  );
};

export default Install;
