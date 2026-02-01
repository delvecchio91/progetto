import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatUSDCRounded, formatUSDCWhole, formatPower } from "@/lib/formatters";
import { motion } from "framer-motion";
import { Cpu, Zap, TrendingUp, Gift, ChevronRight, Clock, Info, X, ZoomIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTransactionPin } from "@/hooks/useTransactionPin";
import { TransactionPinModal } from "@/components/TransactionPinModal";
import { SetupPinModal } from "@/components/SetupPinModal";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserDevice {
  id: string;
  device_id: string;
  status: string | null;
  is_gifted: boolean | null;
  mining_devices: {
    id: string;
    name: string;
    computing_power: number;
    image_url: string | null;
  };
}

interface UserTask {
  id: string;
  status: string | null;
  tasks: {
    min_computing_power: number;
  };
}

interface Device {
  id: string;
  name: string;
  price: number;
  computing_power: number;
  image_url: string | null;
  description: string | null;
  is_promo: boolean | null;
}

const Products = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [devices, setDevices] = useState<Device[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [confirmDevice, setConfirmDevice] = useState<Device | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [userDevices, setUserDevices] = useState<UserDevice[]>([]);
  const [devicesDialogOpen, setDevicesDialogOpen] = useState(false);
  const [totalPowerNeeded, setTotalPowerNeeded] = useState(0);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSetupPinModal, setShowSetupPinModal] = useState(false);
  const [pendingPurchaseDevice, setPendingPurchaseDevice] = useState<Device | null>(null);
  const [imageZoomOpen, setImageZoomOpen] = useState(false);
  const pinSetupSuccessRef = useRef(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { hasPin, verifyPin, refreshPinStatus } = useTransactionPin();

  // Auto-open "My Devices" dialog if coming back from device details
  useEffect(() => {
    if (searchParams.get('from') === 'my-devices') {
      setDevicesDialogOpen(true);
      // Clean up the URL parameter
      searchParams.delete('from');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const [devicesRes, profileRes, userDevicesRes, userTasksRes] = await Promise.all([
      supabase.from("mining_devices").select("*").eq("is_active", true).order("is_promo", { ascending: false }).order("price", { ascending: true }),
      supabase.from("profiles").select("wallet_balance").eq("user_id", user!.id).single(),
      supabase
        .from("user_devices")
        .select(`
          id,
          device_id,
          status,
          is_gifted,
          mining_devices (
            id,
            name,
            computing_power,
            image_url
          )
        `)
        .eq("user_id", user!.id)
        .neq("status", "completed"),
      supabase
        .from("user_tasks")
        .select(`
          id,
          status,
          tasks (
            min_computing_power
          )
        `)
        .eq("user_id", user!.id)
        .eq("status", "processing"),
    ]);
    if (devicesRes.data) setDevices(devicesRes.data);
    if (profileRes.data) setBalance(profileRes.data.wallet_balance);
    if (userDevicesRes.data) {
      const validDevices = userDevicesRes.data.filter(d => d.mining_devices) as UserDevice[];
      setUserDevices(validDevices);
    }
    // Calculate total power needed from active tasks
    if (userTasksRes.data) {
      const validTasks = userTasksRes.data.filter(t => t.tasks) as UserTask[];
      const totalPower = validTasks.reduce((sum, task) => sum + (task.tasks.min_computing_power || 0), 0);
      setTotalPowerNeeded(totalPower);
    }
    setLoading(false);
  };

  // Calculate which devices are "In elaborazione" based on total power needed
  const getDeviceAllocation = () => {
    if (totalPowerNeeded === 0) {
      return { processingDevices: new Set<string>(), allocatedPower: 0 };
    }

    // Sort devices by computing power (descending) to allocate efficiently
    const sortedDevices = [...userDevices].sort(
      (a, b) => b.mining_devices.computing_power - a.mining_devices.computing_power
    );

    const processingDevices = new Set<string>();
    let allocatedPower = 0;

    for (const device of sortedDevices) {
      if (allocatedPower >= totalPowerNeeded) break;
      processingDevices.add(device.id);
      allocatedPower += device.mining_devices.computing_power;
    }

    return { processingDevices, allocatedPower };
  };

  const { processingDevices, allocatedPower } = getDeviceAllocation();

  const handlePurchaseRequest = (device: Device) => {
    if (balance < device.price) {
      toast({ title: t("insufficientBalance"), variant: "destructive" });
      return;
    }

    // Check if user has PIN set up
    if (!hasPin) {
      pinSetupSuccessRef.current = false;
      setPendingPurchaseDevice(device);
      setShowSetupPinModal(true);
      return;
    }

    // Request PIN verification
    setPendingPurchaseDevice(device);
    setShowPinModal(true);
  };

  const executePurchase = async (device: Device) => {
    setPurchasing(true);

    try {
      // Use secure server-side function for purchase
      const { data, error } = await supabase.rpc('process_device_purchase', {
        p_user_id: user!.id,
        p_device_id: device.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; device_name?: string };

      if (!result.success) {
        throw new Error(result.error || 'Errore durante l\'acquisto');
      }

      toast({ title: t("devicePurchased") });
      setSelectedDevice(null);
      setConfirmDevice(null);
      setPendingPurchaseDevice(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const handlePinConfirm = async (pin: string): Promise<boolean> => {
    const isValid = await verifyPin(pin);
    if (isValid && pendingPurchaseDevice) {
      // Close the product details dialog before executing purchase
      setSelectedDevice(null);
      await executePurchase(pendingPurchaseDevice);
    }
    return isValid;
  };

  const handlePinSetupSuccess = () => {
    pinSetupSuccessRef.current = true;
    refreshPinStatus();
    // Close the confirm dialog since we're moving to PIN verification
    setConfirmDevice(null);
    if (pendingPurchaseDevice) {
      setShowPinModal(true);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const myDevicesButton = (
    <button
      onClick={() => setDevicesDialogOpen(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium"
    >
      <Cpu className="w-4 h-4" />
      <span>{t("myDevices")}</span>
      <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full ml-1">
        {userDevices.length}
      </span>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );

  return (
    <PageLayout title={t("miningProducts")} subtitle={t("selectDevice")} rightElement={myDevicesButton}>
      <div className="space-y-6">
        {/* Rental Notice */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{t("rentalDuration")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("rentalDurationDesc")}
            </p>
          </div>
        </div>

        {/* Balance Card */}
        <GlassCard className="flex items-center gap-3 p-4 max-w-fit">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("availableBalanceShort")}</p>
            <p className="text-xl font-display font-bold text-primary">{formatUSDCRounded(balance)}</p>
          </div>
        </GlassCard>

        {/* Devices Grid */}
        <div className="grid grid-cols-2 gap-4">
          {devices.map((device, index) => (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <GlassCard 
                className="p-0 overflow-hidden cursor-pointer hover:border-primary/50 transition-all hover:scale-[1.02] relative"
                onClick={() => {
                  setImageZoomOpen(false);
                  setSelectedDevice(device);
                }}
              >
                {/* Promo Badge */}
                {device.is_promo && (
                  <div className="absolute top-2 right-2 z-10 bg-warning text-warning-foreground text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                    {t("promo")}
                  </div>
                )}
                {/* Device Image */}
                <div className="aspect-[4/3] w-full overflow-hidden">
                  {device.image_url ? (
                    <img 
                      src={device.image_url} 
                      alt={device.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full gradient-primary flex items-center justify-center">
                      <Cpu className="w-12 h-12 text-primary-foreground" />
                    </div>
                  )}
                </div>
                
                {/* Device Info */}
                <div className="p-3 space-y-2">
                  {/* Name */}
                  <h3 className="font-display font-bold text-sm truncate">{device.name}</h3>
                  
                  {/* Computing Power */}
                  <div className="flex items-center gap-1 text-primary">
                    <Zap className="w-4 h-4" />
                    <span className="font-semibold text-sm">{formatPower(device.computing_power)}</span>
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-center justify-between text-sm pt-1 border-t border-border/30">
                    <span className="text-muted-foreground">{t("price")}</span>
                    <span className="font-bold">{formatUSDCWhole(device.price)}</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {devices.length === 0 && (
          <GlassCard className="text-center py-8">
            <p className="text-muted-foreground">{t("noDevicesAvailable")}</p>
          </GlassCard>
        )}
      </div>

      {/* Device Details Dialog */}
      <Dialog
        open={!!selectedDevice}
        onOpenChange={(open) => {
          if (!open) {
            setImageZoomOpen(false);
            setSelectedDevice(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">{t("productDetails")}</DialogTitle>
          </DialogHeader>
          
          {selectedDevice && (
            <div className="space-y-4">
              {/* Device Image/Icon - Clickable for zoom */}
              <div className="flex justify-center">
                {selectedDevice.image_url ? (
                  <div 
                    className="relative cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageZoomOpen(true);
                    }}
                  >
                    <img 
                      src={selectedDevice.image_url} 
                      alt={selectedDevice.name}
                      className="w-24 h-24 rounded-xl object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <ZoomIn className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl gradient-primary flex items-center justify-center">
                    <Cpu className="w-12 h-12 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Device Name and Price */}
              <div className="text-center">
                <h3 className="font-display font-bold text-xl">{selectedDevice.name}</h3>
                <p className="text-2xl font-bold text-primary mt-1">{formatUSDCRounded(selectedDevice.price)}</p>
              </div>

              {/* Description */}
              {selectedDevice.description && (() => {
                const desc = selectedDevice.description;
                const specsIndex = desc.indexOf('🔧');
                
                if (specsIndex > -1) {
                  const mainDescription = desc.substring(0, specsIndex).trim();
                  const technicalSpecs = desc.substring(specsIndex).trim();
                  
                  return (
                    <div className="text-sm text-muted-foreground text-center space-y-3">
                      <p>{mainDescription}</p>
                      <p>{technicalSpecs}</p>
                    </div>
                  );
                }
                
                return (
                  <p className="text-sm text-muted-foreground text-center">
                    {desc}
                  </p>
                );
              })()}

              {/* Stats */}
              <div className="flex justify-center">
                <GlassCard className="p-3 text-center px-6">
                  <Zap className="w-5 h-5 text-warning mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">{t("computingPower")}</p>
                  <p className="font-semibold">{formatPower(selectedDevice.computing_power)}</p>
                </GlassCard>
              </div>

              {/* Purchase Button */}
              <Button
                className="w-full gradient-primary"
                disabled={balance < selectedDevice.price}
                onClick={() => setConfirmDevice(selectedDevice)}
              >
                {balance < selectedDevice.price ? t("insufficientBalance") : t("buyNow")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Zoom Lightbox */}
      {selectedDevice?.image_url && imageZoomOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setImageZoomOpen(false)}
        >
          <button
            onClick={() => setImageZoomOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <motion.img
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 25 }}
            src={selectedDevice.image_url}
            alt={selectedDevice.name}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-6 left-0 right-0 text-center text-white/80 font-medium">
            {selectedDevice.name}
          </p>
        </motion.div>
      )}

      {/* Confirm Purchase Dialog */}
      <AlertDialog open={!!confirmDevice} onOpenChange={() => setConfirmDevice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmPurchase")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("purchaseConfirmMessage")} <strong>{confirmDevice?.name}</strong> {t("for")}{" "}
              <strong>{confirmDevice && formatUSDCRounded(confirmDevice.price)}</strong>.
              <br />
              {t("balanceDeducted")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={purchasing}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="gradient-primary"
              disabled={purchasing}
              onClick={() => confirmDevice && handlePurchaseRequest(confirmDevice)}
            >
              {purchasing ? t("purchasing") : t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* My Devices Dialog */}
      <Dialog open={devicesDialogOpen} onOpenChange={setDevicesDialogOpen}>
        <DialogContent className="glass-card border-border/50 max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-display text-center">
              {t("myDevices")}
            </DialogTitle>
          </DialogHeader>
          
          {/* Power Usage Summary */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("totalPower")}</span>
              <span className="font-bold text-foreground">{userDevices.reduce((sum, d) => sum + d.mining_devices.computing_power, 0)} TH/s</span>
            </div>
            {totalPowerNeeded > 0 && (
              <>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">{t("powerRequired")}</span>
                  <span className="font-bold text-primary">{totalPowerNeeded} TH/s</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">{t("powerAllocated")}</span>
                  <span className="font-bold text-success">{allocatedPower} TH/s</span>
                </div>
                {allocatedPower > totalPowerNeeded && (
                  <div className="flex items-center justify-between text-sm mt-1 pt-1 border-t border-primary/20">
                    <span className="text-muted-foreground">{t("excessPower")}</span>
                    <span className="font-bold text-amber-400">{allocatedPower - totalPowerNeeded} TH/s</span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            {userDevices.length === 0 ? (
              <div className="col-span-2 text-center py-6">
                <Cpu className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t("noDevicesOwned")}</p>
              </div>
            ) : (
              userDevices.map(device => {
                const isProcessing = processingDevices.has(device.id);
                return (
                  <div 
                    key={device.id}
                    onClick={() => {
                      setDevicesDialogOpen(false);
                      navigate(`/device/${device.mining_devices.id}?ud=${device.id}&from=my-devices`);
                    }}
                    className={`flex flex-col items-center p-3 rounded-xl border aspect-square justify-center gap-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
                      isProcessing 
                        ? "bg-primary/10 border-primary/30 hover:border-primary/50" 
                        : "bg-background/50 border-border/30 hover:border-border/50"
                    }`}
                  >
                    {/* Status Badge */}
                    <Badge 
                      variant={isProcessing ? "default" : "secondary"}
                      className={`text-[9px] px-1.5 py-0 ${
                        isProcessing 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isProcessing ? t("processing") : t("standby")}
                    </Badge>
                    
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      {device.mining_devices.image_url ? (
                        <img 
                          src={device.mining_devices.image_url} 
                          alt={device.mining_devices.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Cpu className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <p className="font-medium text-xs truncate max-w-[80px]">{device.mining_devices.name}</p>
                        {device.is_gifted && <Gift className="w-3 h-3 text-accent flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {device.mining_devices.computing_power} TH/s
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <TransactionPinModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPendingPurchaseDevice(null);
        }}
        onConfirm={handlePinConfirm}
        title={t("confirmPurchase")}
        description={t("enterPinToConfirm")}
        isLoading={purchasing}
      />

      <SetupPinModal
        isOpen={showSetupPinModal}
        onClose={() => {
          setShowSetupPinModal(false);
          if (!pinSetupSuccessRef.current) {
            setPendingPurchaseDevice(null);
          }
          pinSetupSuccessRef.current = false;
        }}
        onSuccess={handlePinSetupSuccess}
      />
    </PageLayout>
  );
};

export default Products;
