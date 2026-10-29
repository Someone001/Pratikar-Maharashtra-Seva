import React from 'react';

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  options,
  value,
  onChange,
  error,
  hint,
  required,
  className = '',
}) => {
  const groupId = React.useId();
  const hintId = `${groupId}-hint`;
  const errorId = `${groupId}-error`;

  return (
    <fieldset
      className={`space-y-2 border-none p-0 m-0 ${className}`}
      aria-describedby={[hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined}
    >
      {label && (
        <legend className="text-sm font-medium text-foreground mb-2">
          {label}
          {required && <span className="ml-1 text-danger" aria-hidden="true">*</span>}
        </legend>
      )}

      <div className="space-y-2">
        {options.map((opt) => {
          const optionId = `${groupId}-${opt.value}`;
          const isChecked = value === opt.value;

          return (
            <label
              key={opt.value}
              htmlFor={optionId}
              className={`flex items-start gap-3 rounded-lg border p-3.5 transition-colors cursor-pointer select-none ${
                isChecked
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border bg-surface/30 text-foreground hover:bg-surface/60'
              } ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                id={optionId}
                name={name}
                value={opt.value}
                checked={isChecked}
                disabled={opt.disabled}
                onChange={() => onChange(opt.value)}
                className="mt-0.5 h-4 w-4 text-primary border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              />
              <div className="text-sm flex-1">
                <span className="font-medium text-foreground block">{opt.label}</span>
                {opt.description && (
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    {opt.description}
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground mt-1">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-xs font-medium text-danger mt-1" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
};

