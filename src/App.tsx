import { Suspense, lazy } from "react";
// Force rebuild: v2
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { PWAInstallModal } from "@/components/PWAInstallModal";
import { ChunkLoadErrorBoundary } from "@/components/app/ChunkLoadErrorBoundary";
// Lazy load all pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Products = lazy(() => import("./pages/Products"));
const Earnings = lazy(() => import("./pages/Earnings"));
const TaskDetails = lazy(() => import("./pages/TaskDetails"));
const Wallet = lazy(() => import("./pages/Wallet"));
const WalletDeposit = lazy(() => import("./pages/WalletDeposit"));
const WalletWithdraw = lazy(() => import("./pages/WalletWithdraw"));
const WalletTransactions = lazy(() => import("./pages/WalletTransactions"));
const Settings = lazy(() => import("./pages/Settings"));
const Admin = lazy(() => import("./pages/Admin"));
const Team = lazy(() => import("./pages/Team"));
const Referral = lazy(() => import("./pages/Referral"));
const DeviceDetails = lazy(() => import("./pages/DeviceDetails"));
const FortuneWheel = lazy(() => import("./pages/FortuneWheel"));
const TcoinConvert = lazy(() => import("./pages/TcoinConvert"));
const ResetPin = lazy(() => import("./pages/ResetPin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Welcome = lazy(() => import("./pages/Welcome"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const About = lazy(() => import("./pages/About"));
const Install = lazy(() => import("./pages/Install"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="w-full max-w-md space-y-4">
      <div className="h-12 w-3/4 mx-auto bg-muted/50 rounded-lg animate-pulse" />
      <div className="h-32 w-full bg-muted/50 rounded-lg animate-pulse" />
      <div className="h-8 w-1/2 mx-auto bg-muted/50 rounded-lg animate-pulse" />
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PWAInstallButton />
          <PWAInstallModal />
          <BrowserRouter>
            <ChunkLoadErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/welcome" element={<Welcome />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/earnings" element={<Earnings />} />
                  <Route path="/task/:taskId" element={<TaskDetails />} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/wallet/deposit" element={<WalletDeposit />} />
                  <Route path="/wallet/withdraw" element={<WalletWithdraw />} />
                  <Route path="/wallet/transactions" element={<WalletTransactions />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/team" element={<Team />} />
                  <Route path="/referral" element={<Referral />} />
                  <Route path="/device/:deviceId" element={<DeviceDetails />} />
                  <Route path="/fortune-wheel" element={<FortuneWheel />} />
                  <Route path="/tcoin-convert" element={<TcoinConvert />} />
                  <Route path="/reset-pin" element={<ResetPin />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/install" element={<Install />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ChunkLoadErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
