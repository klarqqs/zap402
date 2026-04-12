import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  variant?: 'text' | 'rect' | 'circle';
  lines?: number;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'text',
  lines = 1,
  className = '',
}) => {
  const shapeClass =
    variant === 'circle' ? 'rounded-full' : variant === 'text' ? 'rounded-full' : '';

  if (variant === 'text') {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`editorial-skeleton ${shapeClass} ${className}`}
            style={{
              width: width || (lines > 1 && i === lines - 1 ? '70%' : '100%'),
              height: height || '1rem',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      data-testid={`skeleton-${variant}`}
      className={`editorial-skeleton ${shapeClass} ${className}`}
      style={{
        width: width || (variant === 'circle' ? '3rem' : '100%'),
        height: height || (variant === 'circle' ? '3rem' : '10rem'),
      }}
    />
  );
};

export default Skeleton;
