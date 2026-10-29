import React, { useEffect, useRef } from 'react';
import { IconButton } from './IconButton';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  const descId = React.useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleBackdrop = (e: MouseEvent) => {
      if (e.target === dialog) {
        onClose();
      }
    };

    dialog.addEventListener('click', handleBackdrop);
    return () => dialog.removeEventListener('click', handleBackdrop);
  }, [onClose]);

  // Handle native cancel event (e.g. Esc key pressed)
  const handleCancel = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onClose();
  };

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      className={`fixed inset-0 m-auto w-full ${maxWidthStyles[maxWidth]} rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm open:animate-in open:fade-in open:zoom-in-95 closed:animate-out closed:fade-out closed:zoom-out-95`}
    >
      <div className="flex flex-col p-6">
        <div className="flex items-start justify-between gap-4 pb-4">
          <div className="space-y-1">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <IconButton
            size="sm"
            aria-label="Close dialog"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground -mr-2 -mt-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </IconButton>
        </div>

        <div className="py-2">{children}</div>

        {footer && (
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-border/40">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
};
