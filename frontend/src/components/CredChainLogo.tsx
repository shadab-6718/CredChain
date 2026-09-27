import React from "react";

interface CredChainLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showSubtext?: boolean;
}

export const CredChainLogo: React.FC<CredChainLogoProps> = ({
  className = "",
  iconOnly = false,
  size = "md",
  showSubtext = true,
}) => {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Interlocking Trustmark SVG Symbol */}
      <div className={`${iconSizes[size]} flex-shrink-0 relative`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          className="w-full h-full drop-shadow-[0_0_10px_rgba(0,229,255,0.45)]"
        >
          <defs>
            <linearGradient id="logoGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="60%" stopColor="#00838F" />
              <stop offset="100%" stopColor="#004D40" />
            </linearGradient>
            <filter id="logoNodeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Left/Upper Interlocking Link forming 'C' */}
          <path
            d="M 230,120 L 190,120 C 124,120 70,174 70,240 C 70,306 124,360 190,360 L 230,360 C 242,360 252,350 252,338 L 252,302 C 252,290 242,280 230,280 L 196,280 C 174,280 156,262 156,240 C 156,218 174,200 196,200 L 230,200 C 242,200 252,190 252,178 L 252,142 C 252,130 242,120 230,120 Z"
            fill="url(#logoGradPrimary)"
          />

          {/* Right/Lower Interlocking Link forming reverse 'C' */}
          <path
            d="M 282,392 L 322,392 C 388,392 442,338 442,272 C 442,206 388,152 322,152 L 282,152 C 270,152 260,162 260,174 L 260,210 C 260,222 270,232 282,232 L 316,232 C 338,232 356,250 356,272 C 356,294 338,312 316,312 L 282,312 C 270,312 260,322 260,334 L 260,370 C 260,382 270,392 282,392 Z"
            fill="#00E5FF"
          />

          {/* Central Keystone */}
          <rect
            x="232"
            y="232"
            width="48"
            height="48"
            rx="12"
            fill="#FFFFFF"
            transform="rotate(45 256 256)"
            filter="url(#logoNodeGlow)"
          />
          <circle cx="256" cy="256" r="8" fill="#006064" />

          {/* Proof Dots */}
          <circle cx="256" cy="96" r="10" fill="#00E5FF" />
          <circle cx="256" cy="416" r="10" fill="#00838F" />
          <circle cx="96" cy="240" r="10" fill="#00E5FF" />
          <circle cx="416" cy="272" r="10" fill="#00E5FF" />
        </svg>
      </div>

      {/* Brand Typography */}
      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-bold ${textSizes[size]} tracking-tight text-slate-900 dark:text-white flex items-center`}
          >
            Cred<span className="text-[#00B4D8] dark:text-[#00E5FF]">Chain</span>
          </span>
          {showSubtext && (
            <span className="text-[9px] font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-0.5">
              Proof Registry
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CredChainLogo;
