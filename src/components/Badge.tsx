import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'verified' | 'unverified' | 'neutral' | 'info' | 'warning' | 'danger' | 'success' | 'default';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  ...props
}) => {
  const variantStyles = {
    verified: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 font-medium',
    unverified: 'bg-amber-950/80 text-amber-300 border-amber-700/60 font-medium',
    neutral: 'bg-surface text-muted-foreground border-border',
    default: 'bg-surface text-muted-foreground border-border',
    info: 'bg-sky-950/80 text-sky-300 border-sky-700/60',
    warning: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
    danger: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
    success: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 font-medium',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border leading-none select-none transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {variant === 'verified' && (
        <svg className="h-3 w-3 text-emerald-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {variant === 'unverified' && (
        <svg className="h-3 w-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )}
      <span>{children}</span>
    </span>
  );
};

