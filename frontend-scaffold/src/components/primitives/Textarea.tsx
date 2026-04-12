import React, { useState } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  maxLength?: number;
  rows?: number;
  variant?: 'default' | 'editorial';
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  maxLength,
  rows = 4,
  variant = 'default',
  className = '',
  id,
  onChange,
  value,
  defaultValue,
  ...props
}) => {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const [charCount, setCharCount] = useState(() => {
    const initialValue = value?.toString() || defaultValue?.toString() || '';
    return initialValue.length;
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
    onChange?.(e);
  };

  const labelClass =
    variant === 'editorial'
      ? 'block font-body text-sm font-semibold tracking-normal text-zap-ink mb-2'
      : 'block text-sm font-bold uppercase tracking-wide mb-2';

  const textareaClass =
    variant === 'editorial'
      ? `w-full resize-y rounded-xl border border-zap-bg-alt bg-zap-bg-alt/45 px-4 py-3 font-body font-medium text-zap-ink shadow-none transition-colors
          placeholder:text-zap-ink-muted/70 focus:border-zap-bg-alt focus:outline-none focus:ring-2 focus:ring-zap-brand/30 focus:ring-offset-2 focus:ring-offset-transparent
          dark:border-zap-bg-alt-bright dark:bg-zap-bg-raised dark:placeholder:text-zap-ink-muted/80 dark:focus:ring-offset-zap-bg
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/25' : ''} ${className}`
      : `w-full px-4 py-3 border-2 border-black bg-white text-black font-medium
          focus:outline-none focus-visible:ring-2 focus-visible:ring-zap-brand/30 focus-visible:ring-offset-2 focus:ring-offset-zap-bg
          placeholder:text-gray-400 resize-y ${error ? 'border-red-600' : ''} ${className}`;

  const countClass =
    variant === 'editorial'
      ? charCount >= maxLength!
        ? 'text-red-600 dark:text-red-400'
        : 'text-zap-ink-muted dark:text-zinc-500'
      : charCount >= maxLength!
        ? 'text-red-600'
        : 'text-gray-500';

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className={labelClass}
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        maxLength={maxLength}
        className={textareaClass}
        onChange={handleChange}
        value={value}
        defaultValue={defaultValue}
        {...props}
      />
      <div className="flex justify-between items-center mt-1">
        {error ? (
          <p className="text-sm text-red-600 font-medium dark:text-red-400">{error}</p>
        ) : (
          <div />
        )}
        {maxLength && (
          <p className={`text-sm font-medium ${countClass}`}>
            {charCount} / {maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default Textarea;
