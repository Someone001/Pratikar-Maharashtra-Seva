import React, { useState } from 'react';
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
  Field,
  Dialog,
  Banner,
} from '../../components';

export const UnlockView: React.FC = () => {
  const { t } = useI18n();
  const { unlock, wipe } = useVault();

  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const success = await unlock(passphrase);
    setIsSubmitting(false);

    if (!success) {
      setError(t('vault.invalidPassphrase'));
    }
  };

  const handleConfirmWipe = async () => {
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
            <Field
              label={t('vault.passphraseLabel')}
              type="password"
              required
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="••••••••"
              error={error ?? undefined}
            />

            <p className="text-xs text-muted-foreground text-center">
              {t('vault.autoLockNotice')}
            </p>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
              {t('vault.unlockBtn')}
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
            <Button variant="ghost" onClick={() => setIsWipeModalOpen(false)}>
              {t('vault.cancel')}
            </Button>
            <Button variant="danger" isLoading={isWiping} onClick={handleConfirmWipe}>
              {t('vault.wipeConfirmAction')}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Banner variant="danger" title="Irreversible Action">
            {t('vault.wipeConfirmBody')}
          </Banner>
        </div>
      </Dialog>
    </div>
  );
};
