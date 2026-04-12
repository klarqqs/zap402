import React, { useState, useMemo } from 'react';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: AvatarSize;
  address?: string;
  fallback?: string;
  /** Extra classes on the outer wrapper (e.g. rounded-none for square avatars). */
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
  xl: 'w-24 h-24 text-lg',
  /** Profile hero — Zap page & public profile identity strip */
  '2xl': 'w-36 h-36 text-2xl sm:w-40 sm:h-40 sm:text-3xl',
};

function hashString(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Deterministic fill in the teal–cyan band (matches `--color-teal`, no random blues/purples). */
function brandTintFromSeed(seed: string): string {
  const h = hashString(seed);
  const hue = 168 + (h % 28);
  const sat = 52 + (h % 20);
  const light = 30 + (h % 14);
  return `hsl(${hue} ${sat}% ${light}%)`;
}

// Get initials from fallback text
function getInitials(fallback: string): string {
  return fallback.slice(0, 2).toUpperCase();
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  address,
  fallback,
  className,
}) => {
  const [imageError, setImageError] = useState(false);

  const fallbackBg = useMemo(() => {
    const key = address || fallback || alt || '?';
    return brandTintFromSeed(key);
  }, [address, fallback, alt]);

  const showImage = src && !imageError;
  const showFallback = !showImage && fallback;
  const showAddressFallback = !showImage && !fallback && address;

  return (
    <div
      className={`${sizeClasses[size]} flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-zap-bg-alt bg-zap-bg-raised font-bold text-white ${className ?? ""}`}
      title={alt}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : showFallback ? (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ backgroundColor: fallbackBg }}
        >
          {getInitials(fallback)}
        </div>
      ) : showAddressFallback ? (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ backgroundColor: fallbackBg }}
        >
          {getInitials(address.slice(-2))}
        </div>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ backgroundColor: fallbackBg }}
        >
          ?
        </div>
      )}
    </div>
  );
};

export default Avatar;
