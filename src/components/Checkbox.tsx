import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, id, className = '', disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const descId = description ? `${inputId}-desc` : undefined;

    return (
      <div className={`flex items-start gap-3 ${className}`}>
        <div className="flex h-6 items-center">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            disabled={disabled}
            aria-describedby={descId}
            className="h-4 w-4 rounded border-border bg-surface text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...props}
          />
        </div>
        <div className="text-sm select-none">
          <label
            htmlFor={inputId}
            className={`font-medium ${disabled ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground cursor-pointer'}`}
          >
            {label}
          </label>
          {description && (
            <p id={descId} className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';
