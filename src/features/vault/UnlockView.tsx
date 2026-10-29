import React, { useState, useEffect } from 'react';
import { useI18n } from '../../lib/i18n';
import { useVault } from './VaultContext';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Dialog,
  Banner,
} from '../../components';

export const UnlockView: React.FC = () => {
  const { t } = useI18n();
  const { unlock, wipe } = useVault();

  const [passphrase, setPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [isWiping, setIsWiping] = useState(false);

  // Progressive delay for failed unlock attempts
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;

    setError(null);
    setIsSubmitting(true);

    const success = await unlock(passphrase);
    setIsSubmitting(false);

    if (!success) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= 5) {
        // Progressive delay: 2s, 4s, 8s, up to 30s
        const delay = Math.min(30, Math.pow(2, newAttempts - 4));
        setLockoutRemaining(delay);
        setError(
          `${t('vault.invalidPassphrase')} Too many failed attempts. Temporary delay active (${delay}s).`,
        );
      } else {
        setError(t('vault.invalidPassphrase'));
      }
    } else {
      setFailedAttempts(0);
    }
  };

  const handleConfirmWipe = async () => {
    if (wipeConfirmText.trim().toUpperCase() !== 'DELETE') {
      return;
    }
    setIsWiping(true);
    await wipe();
    setIsWiping(false);
    setIsWipeModalOpen(false);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card className="border-primary/20 shadow-xl">
        <form onSubmit={handleUnlock}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <CardTitle className="text-xl font-bold">{t('vault.unlockTitle')}</CardTitle>
            <CardDescription className="text-sm pt-1">
              {t('vault.unlockSubtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="unlock-passphrase-input"
                  className="block text-xs font-semibold text-foreground/90 uppercase tracking-wider"
                >
                  {t('vault.passphraseLabel')}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-primary hover:underline focus:outline-none"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="unlock-passphrase-input"
                type={showPassword ? 'text' : 'password'}
                required
                disabled={lockoutRemaining > 0}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-lg border bg-surface/40 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                  error ? 'border-danger' : 'border-border'
                }`}
              />
              {error && (
                <p className="mt-1 text-xs text-danger" role="alert">
                  {error}
                </p>
              )}
            </div>

            {failedAttempts >= 5 && (
              <Banner variant="warning" title="Anti-Snooping Progressive Delay">
                A client-side delay is active ({lockoutRemaining}s remaining) to deter casual local snooping.
                <span className="block pt-1 text-[11px] opacity-80">
                  Note: This cannot stop an attacker with device root access who extracts raw storage files.
                </span>
              </Banner>
            )}

            <p className="text-xs text-muted-foreground text-center">
              {t('vault.autoLockNotice')}
            </p>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={lockoutRemaining > 0}
              isLoading={isSubmitting}
            >
              {lockoutRemaining > 0
                ? `Wait ${lockoutRemaining}s to retry...`
                : t('vault.unlockBtn')}
            </Button>

            <button
              type="button"
              onClick={() => setIsWipeModalOpen(true)}
              className="text-xs text-danger/80 hover:text-danger underline pt-2 text-center"
            >
              {t('vault.wipeVaultBtn')}
            </button>
          </CardFooter>
        </form>
      </Card>

      {/* Emergency Wipe Confirmation Modal */}
      <Dialog
        isOpen={isWipeModalOpen}
        onClose={() => setIsWipeModalOpen(false)}
        title={t('vault.wipeConfirmTitle')}
        maxWidth="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setIsWipeModalOpen(false);
                setWipeConfirmText('');
              }}
            >
              {t('vault.cancel')}
            </Button>
            <Button
              variant="danger"
              disabled={wipeConfirmText.trim().toUpperCase() !== 'DELETE'}
              isLoading={isWiping}
              onClick={handleConfirmWipe}
            >
              {t('vault.wipeConfirmAction')}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Banner variant="danger" title="Irreversible Action">
            {t('vault.wipeConfirmBody')}
          </Banner>

          <div className="space-y-2 pt-1">
            <label
              htmlFor="wipe-confirmation-word"
              className="block text-xs font-semibold text-foreground/90 uppercase tracking-wider"
            >
              Type &quot;DELETE&quot; to confirm:
            </label>
            <input
              id="wipe-confirmation-word"
              type="text"
              value={wipeConfirmText}
              onChange={(e) => setWipeConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-danger"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};
