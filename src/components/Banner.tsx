import React from 'react';

export interface BannerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: 'info' | 'warning' | 'danger' | 'success';
  title?: React.ReactNode;
  icon?: React.ReactNode;
}

export const Banner: React.FC<BannerProps> = ({
  children,
  variant = 'info',
  title,
  icon,
  className = '',
  ...props
}) => {
  const variantStyles = {
    info: 'bg-surface/70 border-border text-foreground',
    warning: 'bg-amber-950/40 border-amber-800/60 text-amber-100',
    danger: 'bg-rose-950/40 border-rose-800/60 text-rose-100',
    success: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-100',
  };

  const defaultIcons = {
    info: (
      <svg className="h-5 w-5 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    danger: (
      <svg className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    ),
  };

  return (
    <div
      role="region"
      aria-label={typeof title === 'string' ? title : 'Notification banner'}
      className={`rounded-xl border p-4 shadow-sm flex items-start gap-3.5 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon ?? defaultIcons[variant]}
      <div className="space-y-1 flex-1 text-sm leading-relaxed">
        {title && <h4 className="font-semibold">{title}</h4>}
        <div>{children}</div>
      </div>
    </div>
  );
};
