import React, { useState } from 'react';
import { Button, type ButtonProps } from './Button';

export interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
  textToCopy: string;
  copyLabel?: string;
  copiedLabel?: string;
  onCopySuccess?: () => void;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  copyLabel = 'Copy',
  copiedLabel = 'Copied!',
  onCopySuccess,
  variant = 'secondary',
  size = 'sm',
  className = '',
  ...props
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      onCopySuccess?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  };

  return (
    <Button
      type="button"
      variant={copied ? 'primary' : variant}
      size={size}
      onClick={handleCopy}
      aria-label={copied ? copiedLabel : copyLabel}
      className={`transition-all ${className}`}
      leftIcon={
        copied ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
          </svg>
        )
      }
      {...props}
    >
      <span aria-live="polite">{copied ? copiedLabel : copyLabel}</span>
    </Button>
  );
};
