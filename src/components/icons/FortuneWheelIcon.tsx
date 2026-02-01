const FortuneWheelIcon = ({ className = "h-4 w-4" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Wheel segments */}
      <circle cx="12" cy="12" r="10" fill="#fbbf24" />
      <path d="M12 2 L12 12 L20.5 6" fill="#ef4444" />
      <path d="M12 12 L20.5 6 L22 12" fill="#22c55e" />
      <path d="M12 12 L22 12 L20.5 18" fill="#3b82f6" />
      <path d="M12 12 L20.5 18 L12 22" fill="#a855f7" />
      <path d="M12 12 L12 22 L3.5 18" fill="#ef4444" />
      <path d="M12 12 L3.5 18 L2 12" fill="#22c55e" />
      <path d="M12 12 L2 12 L3.5 6" fill="#3b82f6" />
      <path d="M12 12 L3.5 6 L12 2" fill="#a855f7" />
      {/* Center */}
      <circle cx="12" cy="12" r="3" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
      <circle cx="12" cy="12" r="1.5" fill="#f59e0b" />
      {/* Border */}
      <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
    </svg>
  );
};

export default FortuneWheelIcon;
