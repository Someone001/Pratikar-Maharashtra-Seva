import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string; // Mandatory for WCAG accessibility
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      children,
      'aria-label': ariaLabel,
      variant = 'ghost',
      size = 'md',
      className = '',
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.96] select-none';

    const variantStyles = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-surface border border-border',
      outline: 'border border-border bg-transparent text-foreground hover:bg-surface',
      ghost: 'bg-transparent text-foreground hover:bg-surface',
      danger: 'bg-danger text-danger-foreground hover:opacity-90 shadow-sm',
    };

    const sizeStyles = {
      sm: 'w-8 h-8 text-sm',
      md: 'w-11 h-11 text-base', // 44x44px touch target
      lg: 'w-12 h-12 text-lg',
    };

    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        disabled={disabled}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';
