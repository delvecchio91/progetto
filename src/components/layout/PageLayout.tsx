import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showNav?: boolean;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
}

export const PageLayout = ({
  children,
  title,
  subtitle,
  showBack = false,
  showNav = true,
  leftElement,
  rightElement,
}: PageLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {(title || showBack || leftElement || rightElement) && (
        <header className="sticky top-0 z-40 glass-card border-b border-border/50 safe-top">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              {showBack && (
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              {leftElement}
              {title && (
                <div>
                  <h1 className="font-display text-lg font-semibold">{title}</h1>
                  {subtitle && (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                  )}
                </div>
              )}
            </div>
            {rightElement}
          </div>
        </header>
      )}

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="px-4 py-6"
      >
        {children}
      </motion.main>

      {showNav && <BottomNav />}
    </div>
  );
};
