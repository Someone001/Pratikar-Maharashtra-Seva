import React, { useEffect } from 'react';

export interface PanicButtonProps {
  redirectUrl?: string;
  onPanic?: () => void;
  className?: string;
}

export const PanicButton: React.FC<PanicButtonProps> = ({
  redirectUrl = 'https://www.google.com',
  onPanic,
  className = '',
}) => {
  const triggerQuickExit = React.useCallback(() => {
    try {
      onPanic?.();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    // Instantly replace window history so back button does not reopen this page
    window.location.replace(redirectUrl);
  }, [redirectUrl, onPanic]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerQuickExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerQuickExit]);

  return (
    <button
      type="button"
      onClick={triggerQuickExit}
      title="Quick Exit (Esc): Leaves site immediately"
      aria-label="Quick Exit: Leaves site immediately and purges active session keys"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-danger/60 bg-danger/20 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-danger/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger active:scale-95 ${className}`}
    >
      <svg
        className="h-4 w-4 text-rose-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      <span>Quick Exit</span>
      <kbd className="hidden sm:inline-block rounded bg-black/40 px-1 py-0.5 text-[10px] font-mono text-muted-foreground ml-1">
        Esc
      </kbd>
    </button>
  );
};

