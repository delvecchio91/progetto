import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  gradient?: "primary" | "accent" | "success" | "warning" | "none";
  glow?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, gradient = "none", glow = false, children, ...props }, ref) => {
    const gradientClasses = {
      primary: "bg-gradient-to-br from-primary/10 to-primary/5",
      accent: "bg-gradient-to-br from-accent/10 to-accent/5",
      success: "bg-gradient-to-br from-success/10 to-success/5",
      warning: "bg-gradient-to-br from-warning/10 to-warning/5",
      none: "",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "glass-card rounded-xl p-4",
          gradientClasses[gradient],
          glow && "glow-primary",
          className
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";
