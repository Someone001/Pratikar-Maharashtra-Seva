import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useVault } from '../vault/VaultContext';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Field,
  Banner,
} from '../../components';

export interface OnboardingViewProps {
  onComplete?: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const { t, language, setLanguage } = useI18n();
  const { initVault } = useVault();

  const [step, setStep] = useState<'disclaimer' | 'age_check' | 'minor_stop' | 'vault_setup'>('disclaimer');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAgeChoice = (isAdult: boolean) => {
    if (isAdult) {
      setStep('vault_setup');
    } else {
      setStep('minor_stop');
    }
  };

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (passphrase.length < 8) {
      setError(t('onboarding.passphraseTooShort'));
      return;
    }

    if (passphrase !== confirmPassphrase) {
      setError(t('onboarding.passphraseMismatch'));
      return;
    }

    setIsSubmitting(true);
    const success = await initVault(passphrase);
    setIsSubmitting(false);

    if (success) {
      onComplete?.();
    } else {
      setError('Failed to create vault. Please try another passphrase.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Language Switcher on Onboarding */}
      <div className="mb-6 flex justify-end gap-2">
        {(['en', 'hi', 'mr'] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setLanguage(lang)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              language === lang
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'bg-surface text-muted-foreground hover:text-foreground'
            }`}
          >
            {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'मराठी'}
          </button>
        ))}
      </div>

      {/* STEP 1: What Pratikar Is / Is Not */}
      {step === 'disclaimer' && (
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <div className="mb-2 inline-flex items-center gap-2 text-primary font-bold text-sm tracking-wide uppercase">
              <span className="flex h-2 w-2 rounded-full bg-primary" />
              {t('app.nativeName')} • {t('app.name')}
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {t('onboarding.title')}
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground pt-1">
              {t('onboarding.subtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-2">
            {/* What Pratikar Does */}
            <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4">
              <h3 className="font-semibold text-emerald-300 text-sm flex items-center gap-2 mb-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                {t('onboarding.whatIsTitle')}
              </h3>
              <ul className="space-y-1.5 text-xs sm:text-sm text-foreground/90 pl-6 list-disc">
                <li>{t('onboarding.whatIs1')}</li>
                <li>{t('onboarding.whatIs2')}</li>
                <li>{t('onboarding.whatIs3')}</li>
                <li>{t('onboarding.whatIs4')}</li>
              </ul>
            </div>

            {/* What Pratikar is NOT */}
            <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4">
              <h3 className="font-semibold text-amber-300 text-sm flex items-center gap-2 mb-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {t('onboarding.whatIsNotTitle')}
              </h3>
              <ul className="space-y-1.5 text-xs sm:text-sm text-foreground/90 pl-6 list-disc">
                <li>{t('onboarding.whatIsNot1')}</li>
                <li>{t('onboarding.whatIsNot2')}</li>
                <li>{t('onboarding.whatIsNot3')}</li>
                <li>{t('onboarding.whatIsNot4')}</li>
              </ul>
            </div>

            <Banner variant="info" title="Privacy Guarantee">
              {t('evidence.warningBanner')}
            </Banner>
          </CardContent>

          <CardFooter className="flex justify-end">
            <Button size="lg" onClick={() => setStep('age_check')}>
              {t('common.save')} & Continue →
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2: Age Verification */}
      {step === 'age_check' && (
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              {t('onboarding.ageCheckTitle')}
            </CardTitle>
            <CardDescription className="text-sm pt-1">
              {t('onboarding.ageQuestion')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleAgeChoice(true)}
                className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface/40 p-6 text-center hover:border-primary hover:bg-primary/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98]"
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                  18+
                </div>
                <span className="font-semibold text-foreground text-sm sm:text-base">
                  {t('onboarding.age18Plus')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleAgeChoice(false)}
                className="flex flex-col items-center justify-center rounded-xl border border-warning/40 bg-warning-surface/20 p-6 text-center hover:border-warning hover:bg-warning-surface/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning active:scale-[0.98]"
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-warning/20 text-warning font-bold">
                  &lt;18
                </div>
                <span className="font-semibold text-warning text-sm sm:text-base">
                  {t('onboarding.ageUnder18')}
                </span>
              </button>
            </div>
          </CardContent>

          <CardFooter>
            <Button variant="ghost" onClick={() => setStep('disclaimer')}>
              ← {t('common.back')}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2B: Minor Stop Flow */}
      {step === 'minor_stop' && (
        <Card className="border-warning bg-card shadow-xl">
          <CardHeader>
            <div className="inline-flex items-center gap-2 text-warning font-semibold text-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {t('onboarding.minorStopTitle')}
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-foreground mt-1">
              Special Protection Required for Minors
            </CardTitle>
            <CardDescription className="text-sm pt-2 text-muted-foreground leading-relaxed">
              {t('onboarding.minorStopBody')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-xl border border-warning/40 bg-warning-surface/30 p-4 space-y-3">
              <h4 className="font-semibold text-sm text-warning">
                Direct Emergency Support Channels:
              </h4>

              <div className="space-y-2">
                <a
                  href="tel:1098"
                  className="flex items-center justify-between rounded-lg bg-surface p-3 text-foreground hover:bg-surface/80 transition-colors border border-border"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
                      📞
                    </span>
                    <span className="text-sm font-semibold">{t('onboarding.minorCall1098')}</span>
                  </div>
                  <span className="text-xs font-bold text-primary">Call 1098</span>
                </a>

                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg bg-surface p-3 text-foreground hover:bg-surface/80 transition-colors border border-border"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent font-bold text-xs">
                      🌐
                    </span>
                    <span className="text-sm font-semibold">{t('onboarding.minorVisitNcrp')}</span>
                  </div>
                  <span className="text-xs text-accent underline">cybercrime.gov.in</span>
                </a>
              </div>
            </div>

            <p className="text-xs text-muted-foreground pl-1">
              • {t('onboarding.minorContactParent')}
            </p>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep('age_check')}>
              ← {t('common.back')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setStep('vault_setup')}
              className="text-xs"
            >
              I am an adult helper assisting on their behalf →
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 3: Vault Passphrase Setup */}
      {step === 'vault_setup' && (
        <Card className="border-primary/30 shadow-xl">
          <form onSubmit={handleCreateVault}>
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl font-bold">
                {t('onboarding.vaultSetupTitle')}
              </CardTitle>
              <CardDescription className="text-sm pt-1">
                {t('onboarding.vaultSetupSubtitle')}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              <Field
                label={t('onboarding.passphraseLabel')}
                type="password"
                required
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder={t('onboarding.passphrasePlaceholder')}
                hint="Use a phrase or PIN you can remember. Minimum 8 characters."
              />

              <Field
                label={t('onboarding.confirmPassphraseLabel')}
                type="password"
                required
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                placeholder={t('onboarding.confirmPassphrasePlaceholder')}
              />

              {error && (
                <div className="rounded-lg bg-danger/10 border border-danger/30 p-3 text-xs font-medium text-danger" role="alert">
                  {error}
                </div>
              )}

              <Banner variant="warning" title="Crucial Security Notice">
                {t('onboarding.passphraseWarning')}
              </Banner>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep('age_check')}>
                ← {t('common.back')}
              </Button>
              <Button type="submit" size="lg" isLoading={isSubmitting}>
                {t('onboarding.createVaultBtn')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
};
