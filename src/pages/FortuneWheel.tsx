import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Coins, Gift, RefreshCw, ArrowRight } from "lucide-react";

interface SpinSettings {
  daily_spins: number;
  tcoin_to_usdc_rate: number;
}

interface UserSpins {
  spins_used: number;
  last_spin_reset: string;
}

// Rainbow colors for the wheel
const WHEEL_SEGMENTS = [
  { value: 5, color: "#FF6B6B", label: "5" },      // Red
  { value: 10, color: "#FF9F43", label: "10" },    // Orange
  { value: 15, color: "#FECA57", label: "15" },    // Yellow
  { value: 25, color: "#48DBFB", label: "25" },    // Cyan
  { value: 50, color: "#1DD1A1", label: "50" },    // Green
  { value: 100, color: "#5F27CD", label: "100" },  // Purple
  { value: 200, color: "#FF6BCB", label: "200" },  // Pink
  { value: 500, color: "#54A0FF", label: "500" },  // Blue
];

const FortuneWheel = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [tcoinBalance, setTcoinBalance] = useState(0);
  const [settings, setSettings] = useState<SpinSettings | null>(null);
  const [userSpins, setUserSpins] = useState<UserSpins | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonAmount, setWonAmount] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  useEffect(() => {
    drawWheel();
  }, []);

  const fetchData = async () => {
    // Fetch T-Coin balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("tcoin_balance")
      .eq("user_id", user!.id)
      .single();

    if (profile) {
      setTcoinBalance(profile.tcoin_balance || 0);
    }

    // Fetch spin settings
    const { data: spinSettings } = await supabase
      .from("spin_settings")
      .select("daily_spins, tcoin_to_usdc_rate")
      .limit(1)
      .maybeSingle();

    if (spinSettings) {
      setSettings(spinSettings);
    }

    // Fetch or create user spins record
    const { data: spins } = await supabase
      .from("user_spins")
      .select("spins_used, last_spin_reset")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (spins) {
      setUserSpins(spins);
    } else {
      // Auto-create record for new users with 3 spins available
      const { data: newSpins, error: insertError } = await supabase
        .from("user_spins")
        .insert({
          user_id: user!.id,
          spins_used: 0,
          last_spin_reset: new Date().toISOString(),
        })
        .select("spins_used, last_spin_reset")
        .single();

      if (!insertError && newSpins) {
        setUserSpins(newSpins);
      } else {
        setUserSpins(null);
      }
    }
  };

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const segmentAngle = (2 * Math.PI) / WHEEL_SEGMENTS.length;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw outer glow ring
    const gradient = ctx.createRadialGradient(centerX, centerY, radius - 5, centerX, centerY, radius + 10);
    gradient.addColorStop(0, "rgba(255, 215, 0, 0.3)");
    gradient.addColorStop(1, "rgba(255, 215, 0, 0)");
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw segments with gradient effect
    WHEEL_SEGMENTS.forEach((segment, index) => {
      const startAngle = index * segmentAngle - Math.PI / 2;
      const endAngle = startAngle + segmentAngle;

      // Create gradient for each segment
      const segGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      segGradient.addColorStop(0, lightenColor(segment.color, 30));
      segGradient.addColorStop(0.5, segment.color);
      segGradient.addColorStop(1, darkenColor(segment.color, 20));

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = segGradient;
      ctx.fill();
      
      // Add white border between segments
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw text with shadow
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = "right";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = "white";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(segment.label, radius - 15, 6);
      ctx.restore();
    });

    // Draw decorative outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255, 215, 0, 0.8)";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw center circle with gradient
    const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 35);
    centerGradient.addColorStop(0, "#FFD700");
    centerGradient.addColorStop(0.5, "#FFA500");
    centerGradient.addColorStop(1, "#FF8C00");
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
    ctx.fillStyle = centerGradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw T-Coin text in center
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 2;
    ctx.fillStyle = "white";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("T-COIN", centerX, centerY + 4);
    ctx.shadowBlur = 0;
  };

  // Helper functions for color manipulation
  const lightenColor = (hex: string, percent: number) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return `rgb(${R}, ${G}, ${B})`;
  };

  const darkenColor = (hex: string, percent: number) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const B = Math.max(0, (num & 0x0000ff) - amt);
    return `rgb(${R}, ${G}, ${B})`;
  };

  const spinWheel = async () => {
    if (isSpinning || !settings || !userSpins) return;

    const remainingSpins = settings.daily_spins - userSpins.spins_used;
    if (remainingSpins <= 0) {
      toast.error(t("outOfDailySpins"));
      return;
    }

    setIsSpinning(true);
    setWonAmount(null);

    // Generate weighted random result (lower values more likely)
    const weights = [35, 28, 18, 10, 5, 3, 0.9, 0.1]; // Weights for each segment (500 T-Coin = 0.1%)
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let winningIndex = 0;

    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        winningIndex = i;
        break;
      }
    }

    const segmentDeg = 360 / WHEEL_SEGMENTS.length;

    // These angles match how the wheel is drawn:
    // drawWheel() uses startAngle = index * segmentAngle - PI/2 => -90deg => 270deg
    const startDeg = 270;
    const pointerDeg = 270; // pointer is at the top (12 o'clock)

    const normalize = (deg: number) => ((deg % 360) + 360) % 360;

    // Given a rotation, compute which segment is currently under the pointer
    const getIndexForRotation = (rot: number) => {
      const r = normalize(rot);
      const angleAtPointer = normalize(pointerDeg - r);
      const offset = normalize(angleAtPointer - startDeg);
      return Math.floor(offset / segmentDeg);
    };

    // Pick a random stop angle inside the winning segment (avoid exact borders)
    const borderPadding = 0.6; // degrees
    const within = borderPadding + Math.random() * (segmentDeg - borderPadding * 2);
    const chosenAngle = normalize(startDeg + winningIndex * segmentDeg + within);

    // We need the wheel rotation remainder such that chosenAngle lands under the pointer
    const desiredRemainder = normalize(pointerDeg - chosenAngle);
    const currentRemainder = normalize(rotation);
    const deltaToTarget = normalize(desiredRemainder - currentRemainder);

    const spins = 5 + Math.random() * 3; // 5-8 full rotations
    const finalRotation = rotation + spins * 360 + deltaToTarget;

    setRotation(finalRotation);

    // Wait for animation to complete
    setTimeout(async () => {
      // Award exactly what the pointer is showing at the end
      const landedIndex = getIndexForRotation(finalRotation);
      const landedSegment = WHEEL_SEGMENTS[landedIndex];

      setWonAmount(landedSegment.value);

      // Use secure edge function to award T-Coins and update balance server-side
      const { data: result, error } = await supabase.functions.invoke("award-tcoin", {
        body: {
          amount: landedSegment.value,
          type: "spin_win",
          notes: "Vinto alla ruota della fortuna",
        },
      });

      if (error) {
        console.error("Error awarding T-Coin:", error);
        toast.error(t("spinError"));
        setIsSpinning(false);
        return;
      }

      // Refetch fresh data from server to ensure consistency
      await fetchData();

      toast.success(`${t("wonTcoin")} ${landedSegment.value} T-Coin! 🎉`);
      setIsSpinning(false);
    }, 4000);
  };

  const remainingSpins = settings && userSpins 
    ? settings.daily_spins - userSpins.spins_used 
    : 0;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <PageLayout title={t("fortuneWheelTitle")} showBack>
      <div className="space-y-6 pb-24">
        {/* T-Coin Balance */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-500/20">
                <Coins className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("tcoinBalance")}</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {tcoinBalance.toLocaleString("it-IT")} T-Coin
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/tcoin-convert")}
              className="gap-2"
            >
              {t("convert")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </GlassCard>

        {/* Remaining Spins */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("availableSpins")}</p>
                <p className="text-xl font-bold">
                  {remainingSpins} / {settings?.daily_spins || 3}
                </p>
              </div>
            </div>
            {!userSpins && (
              <p className="text-xs text-muted-foreground">
                {t("waitForActivation")}
              </p>
            )}
          </div>
        </GlassCard>

        {/* Fortune Wheel */}
        <GlassCard className="p-6 bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-pink-900/30">
          <div className="flex flex-col items-center">
            {/* Pointer */}
            <div className="relative z-10 -mb-4 drop-shadow-lg">
              <div className="w-0 h-0 border-l-[18px] border-r-[18px] border-t-[30px] border-l-transparent border-r-transparent border-t-yellow-400" 
                   style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }} />
            </div>

            {/* Wheel */}
            <motion.div
              style={{ rotate: rotation }}
              animate={{ rotate: rotation }}
              transition={{ duration: 4, ease: [0.2, 0.8, 0.2, 1] }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full animate-pulse opacity-50"
                   style={{ 
                     background: "conic-gradient(from 0deg, #FF6B6B, #FF9F43, #FECA57, #1DD1A1, #48DBFB, #54A0FF, #5F27CD, #FF6BCB, #FF6B6B)",
                     filter: "blur(20px)",
                     transform: "scale(1.1)"
                   }} />
              <canvas
                ref={canvasRef}
                width={280}
                height={280}
                className="rounded-full shadow-2xl relative z-10"
                style={{ filter: "drop-shadow(0 0 20px rgba(255, 215, 0, 0.4))" }}
              />
            </motion.div>

            {/* Win Display */}
            {wonAmount !== null && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-6 text-center"
              >
                <p className="text-lg text-muted-foreground">{t("youWon")}</p>
                <p className="text-4xl font-bold text-yellow-500">
                  {wonAmount} T-Coin
                </p>
              </motion.div>
            )}

            {/* Spin Button */}
            <Button
              onClick={spinWheel}
              disabled={isSpinning || remainingSpins <= 0}
              size="lg"
              className="mt-6 gap-2 px-8"
            >
              {isSpinning ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  {t("spinning")}
                </>
              ) : remainingSpins <= 0 ? (
                t("noSpinsAvailable")
              ) : (
                <>
                  <Gift className="h-5 w-5" />
                  {t("spinWheel")}
                </>
              )}
            </Button>
          </div>
        </GlassCard>

        {/* Info */}
        <GlassCard className="p-4">
          <h3 className="font-semibold mb-2">{t("howItWorks")}</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• {t("freeSpinsFriday")}</li>
            <li>• {t("spinWinRange")}</li>
            <li>• {t("tcoinConvertible")}</li>
            <li>• {t("conversionRate")} {settings?.tcoin_to_usdc_rate || 100} {t("tcoinEquals")}</li>
          </ul>
        </GlassCard>
      </div>
    </PageLayout>
  );
};

export default FortuneWheel;
