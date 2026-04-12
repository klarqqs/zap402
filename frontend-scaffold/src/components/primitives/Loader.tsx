import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({ size = 'md', text }) => {
  const sizes: Record<string, string> = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`${sizes[size]} border-[var(--card-border-soft)] border-t-zap-teal animate-spin`}
        style={{ borderRadius: "9999px" }}
        aria-hidden
      />
      {text && (
        <p className="max-w-xs text-center font-body text-sm font-medium leading-snug text-zap-ink-muted">
          {text}
        </p>
      )}
    </div>
  );
};

export default Loader;
