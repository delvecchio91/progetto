import { cn } from "@/lib/utils";
import { GlassCard } from "./GlassCard";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface StatCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number | ReactNode;
  subValue?: string;
  gradient?: "primary" | "accent" | "success" | "warning" | "none";
  iconBg?: string;
  className?: string;
  action?: ReactNode;
}

export const StatCard = ({
  icon: Icon,
  label,
  value,
  subValue,
  gradient = "none",
  iconBg,
  className,
  action,
}: StatCardProps) => {
  return (
    <GlassCard gradient={gradient} className={cn("relative overflow-hidden", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            {action}
          </div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-display font-bold"
          >
            {value}
          </motion.p>
          {subValue && (
            <p className="text-xs text-muted-foreground">{subValue}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "p-2 rounded-lg",
              iconBg || "bg-primary/10"
            )}
          >
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
    </GlassCard>
  );
};
