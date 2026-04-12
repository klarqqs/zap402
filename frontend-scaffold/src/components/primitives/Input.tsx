import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** `editorial` — soft borders and focus ring (landing / claim flow). */
  variant?: 'default' | 'editorial';
  /** Placed inside the input track, vertically centered on the right (e.g. status icon). */
  endAdornment?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  variant = 'default',
  className = '',
  id,
  endAdornment,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  const labelClass =
    variant === 'editorial'
      ? 'block font-body text-sm font-semibold tracking-normal text-zap-ink mb-2'
      : 'block text-sm font-bold uppercase tracking-wide mb-2';

  const inputClass =
    variant === 'editorial'
      ? `w-full rounded-xl border border-zap-bg-alt bg-zap-bg-alt/45 px-4 py-3 font-body font-medium text-zap-ink shadow-none transition-colors
          placeholder:text-zap-ink-muted/70 focus:border-zap-bg-alt focus:outline-none focus:ring-2 focus:ring-zap-brand/30 focus:ring-offset-2 focus:ring-offset-transparent
          dark:border-zap-bg-alt-bright dark:bg-zap-bg-raised dark:placeholder:text-zap-ink-muted/80 dark:focus:ring-offset-zap-bg
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/25' : ''} ${className}`
      : `w-full px-4 py-3 border-2 border-black bg-white text-black font-medium
          focus:outline-none focus-visible:ring-2 focus-visible:ring-zap-brand/30 focus-visible:ring-offset-2 focus:ring-offset-zap-bg
          placeholder:text-gray-400 ${error ? 'border-red-600' : ''} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={labelClass}
        >
          {label}
        </label>
      )}
      {endAdornment ? (
        <div className="relative w-full">
          <input
            id={inputId}
            className={inputClass}
            {...props}
          />
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center justify-center">
            {endAdornment}
          </div>
        </div>
      ) : (
        <input
          id={inputId}
          className={inputClass}
          {...props}
        />
      )}
      {error && (
        <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default Input;
