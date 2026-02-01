import { useState, useEffect } from "react";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export const useMiningTimer = (endsAt: string | null): TimeRemaining => {
  const calculateTimeRemaining = (): TimeRemaining => {
    if (!endsAt) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    const now = new Date().getTime();
    const end = new Date(endsAt).getTime();
    const total = Math.max(0, end - now);

    if (total <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    return { days, hours, minutes, seconds, total };
  };

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(calculateTimeRemaining);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, [endsAt]);

  return timeRemaining;
};

export const formatTimeRemaining = (time: TimeRemaining): string => {
  if (time.total <= 0) return "Completato";
  
  const parts: string[] = [];
  
  if (time.days > 0) {
    parts.push(`${time.days}g`);
  }
  if (time.hours > 0 || time.days > 0) {
    parts.push(`${time.hours}h`);
  }
  parts.push(`${time.minutes}m`);
  parts.push(`${time.seconds}s`);
  
  return parts.join(" ");
};
