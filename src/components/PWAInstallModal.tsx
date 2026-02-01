import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, PlusSquare, MoreVertical, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "pwa-install-modal-dismissed";

export const PWAInstallModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "ios-chrome" | "android" | "desktop">("desktop");

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    // Check if already installed as PWA
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) return;

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isMobile = isIOS || isAndroid;

    if (!isMobile) return;

    // Detect if iOS but NOT Safari (Chrome, Firefox, etc. on iOS)
    const isChromeOnIOS = isIOS && /crios/.test(userAgent);
    const isFirefoxOnIOS = isIOS && /fxios/.test(userAgent);
    const isEdgeOnIOS = isIOS && /edgios/.test(userAgent);
    const isNonSafariIOS = isIOS && (isChromeOnIOS || isFirefoxOnIOS || isEdgeOnIOS);

    if (isNonSafariIOS) {
      setPlatform("ios-chrome");
    } else if (isIOS) {
      setPlatform("ios");
    } else {
      setPlatform("android");
    }
    
    // Show modal after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleRemindLater = () => {
    setIsVisible(false);
    // Don't set localStorage - will show again next session
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-8"
        onClick={handleRemindLater}
      >
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-md"
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-card"
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="pt-6 pb-4 px-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4">
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground">
              Installa iCore
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Aggiungi l'app alla schermata Home per un accesso rapido!
            </p>
          </div>

          {/* Instructions */}
          <div className="px-6 pb-6">
            {platform === "ios" && (
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 shrink-0">
                    <span className="text-lg font-bold text-primary">1</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-foreground">
                      Tocca l'icona <Share className="inline w-4 h-4 mx-1 text-primary" /> <strong>Condividi</strong> in basso
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 shrink-0">
                    <span className="text-lg font-bold text-primary">2</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-foreground">
                      Tocca <MoreVertical className="inline w-4 h-4 mx-1 text-primary" /> <strong>"Altro..."</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 shrink-0">
                    <span className="text-lg font-bold text-primary">3</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-foreground">
                      Seleziona <PlusSquare className="inline w-4 h-4 mx-1 text-primary" /> <strong>"Aggiungi alla schermata Home"</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 shrink-0">
                    <span className="text-lg font-bold text-primary">4</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-foreground">
                      Tocca <strong>"Aggiungi"</strong> per confermare
                    </p>
                  </div>
                </div>
              </div>
            )}

            {platform === "ios-chrome" && (
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 shrink-0">
                    <span className="text-lg font-bold text-primary">1</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-foreground">
                      Tocca l'icona <Share className="inline w-4 h-4 mx-1 text-primary" /> <strong>Condividi</strong> in alto a destra
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 shrink-0">
                    <span className="text-lg font-bold text-primary">2</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-foreground">
                      Tocca <MoreVertical className="inline w-4 h-4 mx-1 text-primary" /> <strong>"Altro..."</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 shrink-0">
                    <span className="text-lg font-bold text-primary">3</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-foreground">
                      Seleziona <PlusSquare className="inline w-4 h-4 mx-1 text-primary" /> <strong>"Aggiungi alla schermata Home"</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 shrink-0">
                    <span className="text-lg font-bold text-primary">4</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-foreground">
                      Tocca <strong>"Aggiungi"</strong> per confermare
                    </p>
                  </div>
                </div>
              </div>
            )}

            {platform === "android" && (
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 shrink-0">
                    <span className="text-lg font-bold text-primary">1</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-foreground">
                      Tocca il menu <MoreVertical className="inline w-4 h-4 mx-1 text-primary" /> in alto a destra
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 shrink-0">
                    <span className="text-lg font-bold text-primary">2</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-foreground">
                      Seleziona <Download className="inline w-4 h-4 mx-1 text-primary" /> <strong>"Installa app"</strong> o <strong>"Aggiungi a Home"</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 shrink-0">
                    <span className="text-lg font-bold text-primary">3</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-foreground">
                      Conferma toccando <strong>"Installa"</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <Button
              variant="outline"
              onClick={handleRemindLater}
              className="flex-1"
            >
              Dopo
            </Button>
            <Button
              onClick={handleDismiss}
              className="flex-1 gradient-primary"
            >
              Ho capito!
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
