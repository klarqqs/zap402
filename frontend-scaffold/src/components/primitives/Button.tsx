import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'editorial' | 'brandCta' | 'editorialGhost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'sm',
  loading = false,
  icon,
  iconRight,
  children,
  className = '',
  disabled,
  ...props
}) => {
  /** Teal outline CTA — same tokens as header “Connect wallet” (`nav-editorial-cta`). */
  if (variant === 'brandCta') {
    const brandSizes =
      size === 'lg'
        ? 'min-h-[52px] px-8 py-3.5 text-lg'
        : size === 'sm'
          ? 'min-h-10 px-4 py-2 text-sm'
          : 'min-h-11 px-6 py-2.5 text-base';
    return (
      <button
        className={`nav-editorial-cta inline-flex w-full font-body items-center justify-center gap-2 normal-case tracking-normal transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zap-brand focus-visible:ring-offset-2 focus-visible:ring-offset-zap-bg ${brandSizes} ${
          disabled || loading ? 'pointer-events-none opacity-50' : ''
        } ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {icon}
        {children}
        {iconRight}
      </button>
    );
  }

  if (variant === 'editorialGhost') {
    const ghostSizeClass =
      size === 'lg'
        ? 'min-h-[52px] px-8 py-3.5 text-lg'
        : size === 'sm'
          ? 'btn-editorial-ghost--compact text-sm'
          : 'min-h-11 px-6 py-2.5 text-base';
    return (
      <button
        className={`btn-editorial-ghost inline-flex w-full items-center font-body justify-center gap-2 font-medium normal-case tracking-normal transition-opacity ${ghostSizeClass} ${
          disabled || loading ? 'pointer-events-none opacity-50' : ''
        } ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {icon}
        {children}
        {iconRight}
      </button>
    );
  }

  if (variant === 'editorial') {
    const editorialSizes =
      size === 'lg'
        ? 'min-h-[52px] px-8 py-3.5 text-lg'
        : size === 'sm'
          ? 'min-h-10 px-4 py-2 text-sm'
          : 'min-h-[48px] px-6 py-3 text-base';
    return (
      <button
        className={`btn-editorial-primary inline-flex w-full items-center font-body justify-center gap-2 font-medium normal-case tracking-normal transition-opacity ${editorialSizes} ${
          disabled || loading ? 'pointer-events-none opacity-50' : ''
        } ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {icon}
        {children}
        {iconRight}
      </button>
    );
  }

  const base =
    'relative inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wide ' +
    'border-4 border-black shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ' +
    'transition-[transform,filter] duration-200 ease-out motion-reduce:transition-none';

  const variants: Record<string, string> = {
    primary:
      'bg-gradient-to-b from-zinc-700 via-zinc-900 to-black text-white ' +
      'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:brightness-[1.03] ' +
      'active:translate-x-0 active:translate-y-0 active:brightness-100 ' +
      'dark:from-zinc-100 dark:via-white dark:to-zinc-100 dark:text-black dark:border-white',
    outline:
      'bg-gradient-to-b from-white to-zinc-100 text-black ' +
      'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:brightness-[1.02] ' +
      'active:translate-x-0 active:translate-y-0 active:brightness-100 ' +
      'dark:from-zinc-900 dark:to-black dark:text-white dark:border-white',
    ghost:
      'border-transparent bg-transparent text-black ' +
      'hover:border-black hover:-translate-x-px hover:-translate-y-px ' +
      'active:translate-x-0 active:translate-y-0 ' +
      'dark:text-white dark:hover:border-white',
  };

  const disabledShadow =
    variant === 'ghost'
      ? ''
      : 'disabled:translate-x-0 disabled:translate-y-0 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:brightness-100';

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${disabledShadow} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
};

export default Button;
