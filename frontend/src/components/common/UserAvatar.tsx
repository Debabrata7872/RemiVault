import React, { useState, useEffect } from 'react';
import { getEffectiveAvatarUrl } from '../../services/deviceProfiles';

interface UserAvatarProps {
  name?: string;
  email?: string;
  photoUrl?: string | null;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  bgColor?: string;
  fontSize?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  email,
  photoUrl,
  size,
  className = '',
  style = {},
  bgColor,
  fontSize
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  // Compute the candidate avatar source
  const candidateSrc = getEffectiveAvatarUrl(email, name, photoUrl);

  // Reset failure state if the candidate URL changes
  useEffect(() => {
    setImageFailed(false);
  }, [candidateSrc]);

  // Compute initials
  const getInitials = (userName?: string) => {
    if (!userName) return 'U';
    const parts = userName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (userName[0] || 'U').toUpperCase();
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    ...(size ? { width: size, height: size } : {}),
    ...(bgColor ? { background: bgColor } : {}),
    ...style,
  };

  if (candidateSrc && !imageFailed) {
    return (
      <div className={`user-avatar-container ${className}`} style={containerStyle}>
        <img
          src={candidateSrc}
          alt={name || 'User avatar'}
          onError={() => setImageFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 'inherit',
            display: 'block',
          }}
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`user-avatar-container ${className}`}
      style={{
        ...containerStyle,
        color: '#ffffff',
        fontWeight: 700,
        fontSize: fontSize || 'inherit',
        letterSpacing: '-0.02em',
      }}
    >
      <span>{getInitials(name)}</span>
    </div>
  );
};

export default UserAvatar;
