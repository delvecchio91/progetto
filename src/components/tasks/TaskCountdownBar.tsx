import { useMiningTimer, formatTimeRemaining } from "@/hooks/useMiningTimer";
import { Progress } from "@/components/ui/progress";
import { formatUSDCRounded } from "@/lib/formatters";

interface TaskCountdownBarProps {
  endsAt: string | null;
  startedAt: string | null;
  baseDailyReward: number;
  durationDays: number;
  bonusPercentage: number;
}

export const TaskCountdownBar = ({ 
  endsAt, 
  startedAt, 
  baseDailyReward, 
  durationDays, 
  bonusPercentage 
}: TaskCountdownBarProps) => {
  const timeRemaining = useMiningTimer(endsAt);

  // Calculate total promised earnings
  const bonusMultiplier = 1 + (bonusPercentage / 100);
  const totalPromisedEarnings = baseDailyReward * durationDays * bonusMultiplier;

  // Calculate progress percentage and current earnings
  const getProgressAndEarnings = () => {
    if (!startedAt || !endsAt) return { progress: 0, currentEarnings: 0 };
    
    const start = new Date(startedAt).getTime();
    const end = new Date(endsAt).getTime();
    const now = Date.now();
    
    const totalDuration = end - start;
    const elapsed = now - start;
    
    if (totalDuration <= 0) return { progress: 100, currentEarnings: totalPromisedEarnings };
    
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    const currentEarnings = (progress / 100) * totalPromisedEarnings;
    
    return { progress, currentEarnings };
  };

  const { progress, currentEarnings } = getProgressAndEarnings();
  const isCompleted = timeRemaining.total <= 0;

  return (
    <div className="mt-2 space-y-1">
      {/* Earnings row */}
      <div className="flex items-center justify-between text-xs">
        <span className={`font-mono font-semibold ${isCompleted ? "text-green-400" : "text-primary"}`}>
          {formatUSDCRounded(currentEarnings)}
        </span>
        <span className={`font-mono ${isCompleted ? "text-green-400" : "text-primary"}`}>
          / {formatUSDCRounded(totalPromisedEarnings)}
        </span>
      </div>
      
      {/* Progress bar */}
      <Progress 
        value={progress} 
        className="h-1.5 bg-muted/50"
      />
      
      {/* Time remaining */}
      <div className="flex justify-end">
        <span className={`font-mono text-xs font-medium ${isCompleted ? "text-green-400" : "text-foreground"}`}>
          {formatTimeRemaining(timeRemaining)}
        </span>
      </div>
    </div>
  );
};
