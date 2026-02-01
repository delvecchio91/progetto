export const formatUSDC = (amount: number | string): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(num) + " USDC";
};

export const formatUSDCRounded = (amount: number | string): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num) + " USDC";
};

export const formatUSDCWhole = (amount: number | string): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num) + " USDC";
};
export const formatNumber = (num: number | string): string => {
  const n = typeof num === "string" ? parseFloat(num) : num;
  return new Intl.NumberFormat("it-IT").format(n);
};

export const formatPower = (power: number | string): string => {
  const p = typeof power === "string" ? parseFloat(power) : power;
  return p.toFixed(2) + " TH/s";
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export const formatShortDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
};

export const formatCountdown = (endDate: Date): string => {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  if (diff <= 0) return "Completato";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}g ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const generateExactAmount = (amount: number): number => {
  const decimals = Math.floor(Math.random() * 10000) / 10000;
  return amount + decimals;
};
