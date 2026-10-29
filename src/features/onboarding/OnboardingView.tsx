import React, { useState, useEffect } from 'react';
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
  Dialog,
  SafeExternalLink,
} from '../../components';
import { evaluatePassphraseStrength } from '../../lib/passphrase';
import type { Language } from '../../types';

export interface OnboardingViewProps {
  onComplete?: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const { t, language, setLanguage } = useI18n();
  const { initVault, triggerQuickExit } = useVault();

  const [step, setStep] = useState<
    'disclaimer' | 'safety_gate_1' | 'safety_gate_2' | 'minor_stop' | 'vault_setup'
  >('disclaimer');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProtectionModalOpen, setIsProtectionModalOpen] = useState(false);

  // Auto-detect browser language if Hindi/Marathi is preferred
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const navLang = navigator.language.toLowerCase();
      if (navLang.startsWith('mr') && language !== 'mr') {
        setLanguage('mr');
      } else if (navLang.startsWith('hi') && language !== 'hi') {
        setLanguage('hi');
      }
    }
  }, [language, setLanguage]);

  const passphraseStrength = evaluatePassphraseStrength(passphrase);

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
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      {/* Emergency Strip (Section 8.1) */}
      <div className="mb-4 flex items-center justify-between rounded-lg bg-warning-surface/30 border border-warning/40 px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2 text-warning font-medium">
          <span className="text-base" aria-hidden="true">🚨</span>
          <span>In immediate danger?</span>
        </div>
        <a
          href="tel:112"
          className="font-bold text-warning underline hover:text-warning/80 flex items-center gap-1"
        >
          Call Emergency 112 ↗
        </a>
      </div>

      {/* Header Language Switcher & Quick Exit */}
      <div className="mb-6 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={triggerQuickExit}
          className="text-xs font-semibold text-danger/80 hover:text-danger hover:underline flex items-center gap-1"
        >
          <span aria-hidden="true">🚪</span> Quick Exit (Esc)
        </button>

        <div className="flex gap-1.5" role="group" aria-label="Select Language">
          {(['en', 'hi', 'mr'] as const).map((lang: Language) => (
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
      </div>

      {/* STEP 1: Welcome & Privacy Screen (Section 8.1) */}
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
            <CardDescription className="text-sm sm:text-base text-muted-foreground pt-1 leading-relaxed">
              {t('onboarding.subtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-2">
            {/* Visual Panel: Your data never leaves this device (Section 8.1) */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <span>🛡️</span> Your data never leaves this device
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center my-3">
                <div className="rounded-lg bg-surface p-3 border border-border">
                  <div className="text-xl mb-1">📱</div>
                  <span className="text-xs font-semibold text-foreground block">On Your Device</span>
                  <span className="text-[11px] text-muted-foreground">Everything entered stays in your local browser.</span>
                </div>
                <div className="rounded-lg bg-surface p-3 border border-border">
                  <div className="text-xl mb-1">🔒</div>
                  <span className="text-xs font-semibold text-foreground block">Encrypted at Rest</span>
                  <span className="text-[11px] text-muted-foreground">Protected by AES-256 and your private passphrase.</span>
                </div>
                <div className="rounded-lg bg-surface p-3 border border-border">
                  <div className="text-xl mb-1">🚫☁️</div>
                  <span className="text-xs font-semibold text-foreground block">Nothing Sent Out</span>
                  <span className="text-[11px] text-muted-foreground">Zero servers, zero tracking, zero remote databases.</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground pt-1">
                Tip: If someone else has physical access to this phone or computer, open this page in a <strong>private/incognito window</strong>.
              </p>
            </div>

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

          <CardFooter className="flex flex-col sm:flex-row justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsProtectionModalOpen(true)}
            >
              How my data is protected
            </Button>
            <Button size="lg" onClick={() => setStep('safety_gate_1')}>
              Start →
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2A: Safety Check 1 - Are you safe right now? (Section 8.2) */}
      {step === 'safety_gate_1' && (
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Immediate Safety Check
            </CardTitle>
            <CardDescription className="text-sm pt-1">
              Before we begin, your physical well-being and safety come first.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <p className="text-sm text-foreground">
              Are you in a safe and secure physical location right now?
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setStep('safety_gate_2')}
                className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface/40 p-5 text-center hover:border-primary hover:bg-primary/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98]"
              >
                <span className="text-2xl mb-1">✅</span>
                <span className="font-semibold text-foreground text-sm sm:text-base">
                  Yes, I am safe right now
                </span>
              </button>

              <a
                href="tel:112"
                className="flex flex-col items-center justify-center rounded-xl border border-warning/40 bg-warning-surface/30 p-5 text-center hover:border-warning hover:bg-warning-surface/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning active:scale-[0.98]"
              >
                <span className="text-2xl mb-1">🚨</span>
                <span className="font-semibold text-warning text-sm sm:text-base">
                  No, I am in danger (Call 112)
                </span>
              </a>
            </div>
          </CardContent>

          <CardFooter>
            <Button variant="ghost" onClick={() => setStep('disclaimer')}>
              ← {t('common.back')}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2B: Safety Check 2 - Age Verification (Section 8.2) */}
      {step === 'safety_gate_2' && (
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
                onClick={() => setStep('vault_setup')}
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
                onClick={() => setStep('minor_stop')}
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
            <Button variant="ghost" onClick={() => setStep('safety_gate_1')}>
              ← {t('common.back')}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2C: Minor Safety Stop Screen (Section 8.2) */}
      {step === 'minor_stop' && (
        <Card className="border-warning bg-card shadow-xl">
          <CardHeader>
            <div className="inline-flex items-center gap-2 text-warning font-semibold text-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Immediate Child Protection Protocol
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-foreground mt-1">
              Specialized Child Protection Route Required
            </CardTitle>
            <CardDescription className="text-sm pt-2 text-muted-foreground leading-relaxed">
              If the person affected is under 18 years old, self-service takedown via this tool is not the right or safest route. Indian law (including POCSO Act) requires specialized child protection handling. Please do NOT save, forward, or share any images, as possessing child imagery is strictly prohibited by law.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-xl border border-warning/40 bg-warning-surface/30 p-4 space-y-3">
              <h4 className="font-semibold text-sm text-warning">
                Direct Emergency & Protection Channels:
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
                    <span className="text-sm font-semibold">Call Childline at 1098 immediately (24/7, Toll-Free)</span>
                  </div>
                  <span className="text-xs font-bold text-primary">Call 1098</span>
                </a>

                <a
                  href="tel:1930"
                  className="flex items-center justify-between rounded-lg bg-surface p-3 text-foreground hover:bg-surface/80 transition-colors border border-border"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
                      🛡️
                    </span>
                    <span className="text-sm font-semibold">National Cybercrime Helpline 1930</span>
                  </div>
                  <span className="text-xs font-bold text-primary">Call 1930</span>
                </a>

                <SafeExternalLink
                  href="https://cybercrime.gov.in"
                  className="flex items-center justify-between rounded-lg bg-surface p-3 text-foreground hover:bg-surface/80 transition-colors border border-border"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent font-bold text-xs">
                      🌐
                    </span>
                    <span className="text-sm font-semibold">National Cybercrime Reporting Portal (POCSO Wing)</span>
                  </div>
                  <span className="text-xs text-accent underline">cybercrime.gov.in</span>
                </SafeExternalLink>
              </div>
            </div>

            <p className="text-xs text-muted-foreground pl-1">
              • Please speak to a trusted adult, parent, school counselor, or reach out to the nearest police station immediately. No case data is saved on this branch.
            </p>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep('safety_gate_2')}>
              ← {t('common.back')}
            </Button>
            <div className="flex gap-2">
              <Button variant="danger" onClick={triggerQuickExit}>
                Quick Exit
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep('vault_setup')}
                className="text-xs"
              >
                I am an adult helper assisting on their behalf →
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* STEP 3: Vault Setup with Strength Meter (Section 8.3) */}
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
                hint="Tip: Using four random words (e.g., river temple blue shadow) creates a strong, memorable passphrase."
              />

              {/* Custom Heuristic Passphrase Strength Meter (Section 8.3) */}
              {passphrase.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Passphrase Strength:</span>
                    <span
                      className={`font-semibold capitalize ${
                        passphraseStrength.level === 'weak'
                          ? 'text-danger'
                          : passphraseStrength.level === 'fair'
                            ? 'text-warning'
                            : 'text-success'
                      }`}
                    >
                      {passphraseStrength.level} {passphraseStrength.isFourWords ? '(4 Words - Recommended)' : ''}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-full flex-1 rounded-full transition-colors ${
                          passphraseStrength.score >= level
                            ? passphraseStrength.level === 'weak'
                              ? 'bg-danger'
                              : passphraseStrength.level === 'fair'
                                ? 'bg-warning'
                                : 'bg-success'
                            : 'bg-surface'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

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

              <Banner variant="warning" title="Crucial Warning: No Password Recovery">
                Your data is encrypted using PBKDF2 with 600,000 iterations. If you lose or forget this passphrase, your encrypted records cannot be restored or recovered by anyone.
              </Banner>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep('safety_gate_2')}>
                ← {t('common.back')}
              </Button>
              <Button type="submit" size="lg" isLoading={isSubmitting}>
                {t('onboarding.createVaultBtn')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* How My Data is Protected Modal (Section 8.1) */}
      <Dialog
        isOpen={isProtectionModalOpen}
        onClose={() => setIsProtectionModalOpen(false)}
        title="How Your Data is Protected in Pratikar"
        description="Comprehensive client-side security architecture"
        maxWidth="lg"
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setIsProtectionModalOpen(false)}>
              Got it, close
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs sm:text-sm text-foreground/90 leading-relaxed">
          <div className="rounded-lg bg-surface p-3 border border-border">
            <h4 className="font-bold text-foreground mb-1">1. Zero Cloud Connections</h4>
            <p className="text-muted-foreground text-xs">
              Pratikar operates entirely within your browser. There is no remote backend, API server, or analytics collection. Network calls are blocked by a strict Content Security Policy.
            </p>
          </div>

          <div className="rounded-lg bg-surface p-3 border border-border">
            <h4 className="font-bold text-foreground mb-1">2. Hardware-Grade Web Crypto Encryption</h4>
            <p className="text-muted-foreground text-xs">
              When you set a passphrase, the browser derives an AES-256-GCM encryption key using PBKDF2 with 600,000 rounds of SHA-256 hashing. All case records, links, reports, and evidence are encrypted before being written to IndexedDB.
            </p>
          </div>

          <div className="rounded-lg bg-surface p-3 border border-border">
            <h4 className="font-bold text-foreground mb-1">3. Absolute Zero Image Storage Policy</h4>
            <p className="text-muted-foreground text-xs">
              Pratikar strictly refuses to store intimate media files. The file hasher reads screenshots in memory, computes a digital SHA-256 fingerprint, and immediately purges the file from RAM.
            </p>
          </div>

          <div className="rounded-lg bg-surface p-3 border border-border">
            <h4 className="font-bold text-foreground mb-1">4. Instant Memory Purge & Panic Exit</h4>
            <p className="text-muted-foreground text-xs">
              Pressing the Quick Exit button or hitting Escape twice immediately wipes active cryptographic keys from memory and redirects your browser to a neutral website.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
