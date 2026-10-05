import React, { useId } from 'react';

interface BrandLogoProps {
  /** Size in pixels (width and height). Defaults to 36. */
  size?: number;
  /** Custom CSS classes for the container */
  className?: string;
  /** Whether to render the brand text beside the logo */
  showText?: boolean;
  /** Optional version or badge text (e.g. "v0.2.0") */
  badgeText?: string;
  /** Click handler */
  onClick?: () => void;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 36,
  className = '',
  showText = false,
  badgeText,
  onClick,
  style,
}) => {
  const uid = useId().replace(/:/g, '_');
  const shieldBgId = `rv_shield_bg_${uid}`;
  const borderGradId = `rv_border_grad_${uid}`;
  const vaultGradId = `rv_vault_grad_${uid}`;
  const glowId = `rv_glow_${uid}`;

  const iconElement = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label="RemiVault Official Logo"
      style={{
        display: 'block',
        flexShrink: 0,
        filter: 'drop-shadow(0 4px 12px rgba(79, 70, 229, 0.35))',
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s ease',
      }}
    >
      <defs>
        {/* Deep Vault Shield Background */}
        <linearGradient id={shieldBgId} x1="20" y1="10" x2="100" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="50%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#030712" />
        </linearGradient>

        {/* Outer Fintech Border Gradient */}
        <linearGradient id={borderGradId} x1="15" y1="5" x2="105" y2="115" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="35%" stopColor="#4F46E5" />
          <stop offset="70%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Vault Door Octagon Facet */}
        <linearGradient id={vaultGradId} x1="30" y1="30" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#312E81" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0.35" />
        </linearGradient>

        {/* Core Radiance Glow Filter */}
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ambient Glow */}
      <ellipse cx="60" cy="58" rx="44" ry="44" fill="#4F46E5" fillOpacity="0.3" filter={`url(#${glowId})`} />

      {/* Base Cryptographic Shield */}
      <path
        d="M60 12 C78 12 98 19 104 26 C104 56 94 92 60 108 C26 92 16 56 16 26 C22 19 42 12 60 12 Z"
        fill={`url(#${shieldBgId})`}
        stroke={`url(#${borderGradId})`}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Inner Vault Door Octagon */}
      <polygon
        points="60,28 82,37 91,59 82,81 60,90 38,81 29,59 38,37"
        fill={`url(#${vaultGradId})`}
        stroke="#38BDF8"
        strokeWidth="1.8"
        strokeOpacity="0.55"
      />

      {/* Vault Dial Hash Ring */}
      <circle
        cx="60"
        cy="59"
        r="18"
        stroke="#818CF8"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        strokeOpacity="0.8"
      />

      {/* Diagonal Vault Corner Rivets */}
      <circle cx="44" cy="43" r="2" fill="#38BDF8" fillOpacity="0.85" />
      <circle cx="76" cy="43" r="2" fill="#38BDF8" fillOpacity="0.85" />
      <circle cx="76" cy="75" r="2" fill="#38BDF8" fillOpacity="0.85" />
      <circle cx="44" cy="75" r="2" fill="#38BDF8" fillOpacity="0.85" />

      {/* Central Radiant Spark (4-Point Diamond Core) */}
      <path
        d="M60 38 Q60 59 79 59 Q60 59 60 80 Q60 59 41 59 Q60 59 60 38 Z"
        fill="#FFFFFF"
        filter={`url(#${glowId})`}
      />

      {/* Core Center Jewel */}
      <circle cx="60" cy="59" r="3.2" fill="#38BDF8" />
      <circle cx="60" cy="59" r="1.2" fill="#FFFFFF" />
    </svg>
  );

  if (!showText && !badgeText) {
    return (
      <div 
        className={`brand-logo-wrap ${className}`} 
        onClick={onClick} 
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}
      >
        {iconElement}
      </div>
    );
  }

  return (
    <div
      className={`brand ${className}`}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.75rem',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...style,
      }}
    >
      <div className="brand-logo-icon" style={{ display: 'flex', alignItems: 'center' }}>
        {iconElement}
      </div>
      {showText && (
        <span className="brand-name" style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
          <span>Remi</span>
          <span style={{ color: '#818cf8', fontWeight: 800 }}>Vault</span>
        </span>
      )}
      {badgeText && <span className="brand-version">{badgeText}</span>}
    </div>
  );
};
