import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { RentalStatusCard } from "@/components/mining/RentalStatusCard";
import { 
  ArrowLeft, 
  Cpu, 
  Zap, 
  Gift,
  RefreshCw,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";

interface MiningDevice {
  id: string;
  name: string;
  description: string | null;
  price: number;
  computing_power: number;
  image_url: string | null;
  is_promo: boolean | null;
}

interface UserDeviceRental {
  id: string;
  purchased_at: string | null;
  rental_expires_at: string | null;
  is_rental_active: boolean | null;
}

const DeviceDetails = () => {
  const { t } = useLanguage();
  const { deviceId } = useParams<{ deviceId: string }>();
  const [searchParams] = useSearchParams();
  const userDeviceId = searchParams.get('ud');
  const fromMyDevices = searchParams.get('from') === 'my-devices';
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [device, setDevice] = useState<MiningDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGifted, setIsGifted] = useState(false);
  const [userDeviceRental, setUserDeviceRental] = useState<UserDeviceRental | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchDevice = async () => {
    if (!deviceId || !user) return;

    setLoading(true);
    try {
      const { data: deviceData, error: deviceError } = await supabase
        .from("mining_devices")
        .select("*")
        .eq("id", deviceId)
        .maybeSingle();

      if (deviceError) throw deviceError;
      setDevice(deviceData);

      let userDeviceQuery = supabase
        .from("user_devices")
        .select("id, is_gifted, purchased_at, rental_expires_at, is_rental_active")
        .eq("user_id", user.id);
      
      if (userDeviceId) {
        userDeviceQuery = userDeviceQuery.eq("id", userDeviceId);
      } else {
        userDeviceQuery = userDeviceQuery.eq("device_id", deviceId);
      }
      
      const { data: userDevice } = await userDeviceQuery.maybeSingle();

      if (userDevice) {
        setIsGifted(!!userDevice.is_gifted);
        setUserDeviceRental({
          id: userDevice.id,
          purchased_at: userDevice.purchased_at,
          rental_expires_at: userDevice.rental_expires_at,
          is_rental_active: userDevice.is_rental_active,
        });
      }
    } catch (error) {
      console.error("Error fetching device:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevice();
  }, [deviceId, userDeviceId, user]);

  const formatPower = (power: number) => `${power} TH/s`;
  const formatPrice = (price: number) => `${price.toFixed(2)} USDC`;

  if (authLoading || loading) {
    return (
      <PageLayout title={t("deviceDetailsLoading")}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (!device) {
    return (
      <PageLayout title={t("deviceNotFound")}>
        <div className="text-center py-12">
          <Cpu className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {t("deviceNotFoundDesc")}
          </p>
          <Button onClick={() => navigate("/products")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("backToDevices")}
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={device.name}>
      <div className="space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate(fromMyDevices ? "/products?from=my-devices" : "/products")}
          className="mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("goBack")}
        </Button>

        {/* Device Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <GlassCard className="p-6 overflow-hidden">
            <div className="relative">
              {/* Badges */}
              <div className="absolute top-0 left-0 z-10 flex gap-2">
                {device.is_promo && (
                  <Badge className="bg-gradient-to-r from-accent to-pink-500 text-white">
                    {t("promo")}
                  </Badge>
                )}
                {isGifted && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Gift className="w-3 h-3" />
                    {t("gifted")}
                  </Badge>
                )}
              </div>

              {/* Image */}
              <div className="w-full aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden bg-muted mb-6">
                {device.image_url ? (
                  <img
                    src={device.image_url}
                    alt={device.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Cpu className="w-24 h-24 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-display font-bold text-center mb-2">
                {device.name}
              </h1>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 gap-4"
        >
          <GlassCard className="p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-2">
              <Zap className="w-5 h-5 text-warning" />
            </div>
            <p className="text-xs text-muted-foreground mb-1">{t("computingPowerLabel")}</p>
            <p className="font-display font-bold text-lg">{formatPower(device.computing_power)}</p>
          </GlassCard>

          <GlassCard className="p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-2">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <p className="text-xs text-muted-foreground mb-1">{t("priceLabel")}</p>
            <p className="font-display font-bold text-lg">{formatPrice(device.price)}</p>
          </GlassCard>
        </motion.div>

        {/* Description */}
        {device.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <GlassCard className="p-6">
              <h2 className="font-display font-bold text-lg mb-3">{t("descriptionLabel")}</h2>
              {(() => {
                const desc = device.description!;
                const specsIndex = desc.indexOf('🔧');
                
                if (specsIndex > -1) {
                  const mainDescription = desc.substring(0, specsIndex).trim();
                  const technicalSpecs = desc.substring(specsIndex).trim();
                  
                  return (
                    <div className="text-muted-foreground leading-relaxed space-y-3">
                      <p>{mainDescription}</p>
                      <p>{technicalSpecs}</p>
                    </div>
                  );
                }
                
                return (
                  <p className="text-muted-foreground leading-relaxed">
                    {desc}
                  </p>
                );
              })()}
            </GlassCard>
          </motion.div>
        )}

        {/* Rental Status */}
        {userDeviceRental && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <RentalStatusCard
              userDeviceId={userDeviceRental.id}
              deviceName={device.name}
              devicePrice={device.price}
              purchasedAt={userDeviceRental.purchased_at}
              rentalExpiresAt={userDeviceRental.rental_expires_at}
              isRentalActive={userDeviceRental.is_rental_active ?? true}
              onRenewalComplete={fetchDevice}
            />
          </motion.div>
        )}

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <GlassCard className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Cpu className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">{t("deviceInfo")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("deviceInfoDesc").replace("{power}", formatPower(device.computing_power))}
                </p>
                {userDeviceRental?.purchased_at && (
                  <p className="text-xs text-warning mt-2 font-medium">
                    {t("purchasedDeviceOn")} {new Date(userDeviceRental.purchased_at).toLocaleDateString('it-IT', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    })}
                  </p>
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default DeviceDetails;