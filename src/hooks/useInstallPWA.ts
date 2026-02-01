import { useState, useEffect } from "react";

const STORAGE_KEY = "pwa-install-modal-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const useInstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOSChrome, setIsIOSChrome] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    
    // Detect if iOS but NOT Safari (Chrome, Firefox, etc. on iOS)
    // Safari on iOS doesn't have "crios" or "fxios" in user agent
    const isChromeOnIOS = ios && /crios/.test(userAgent);
    const isFirefoxOnIOS = ios && /fxios/.test(userAgent);
    const isEdgeOnIOS = ios && /edgios/.test(userAgent);
    const isNonSafariIOS = ios && (isChromeOnIOS || isFirefoxOnIOS || isEdgeOnIOS);
    
    setIsIOS(ios);
    setIsAndroid(android);
    setIsIOSChrome(isNonSafariIOS);

    // Listen for install prompt (works on Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setCanInstall(false);
        return true;
      }
      return false;
    }
    return false;
  };

  const resetModalDismissed = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  const showInstallInstructions = isIOS || (isAndroid && !canInstall);

  return {
    canInstall,
    isIOS,
    isAndroid,
    isStandalone,
    isIOSChrome,
    promptInstall,
    resetModalDismissed,
    showInstallInstructions,
  };
};
