import React, { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useVault } from '../vault/VaultContext';
import {
  getSettings,
  saveSettings,
  changeVaultPassphrase,
  exportEncryptedBackup,
  importEncryptedBackup,
  loadDemoCase,
  removeDemoCase,
} from '../../lib/storage';
import type { PlaintextSettings, TextSize } from '../../types';
import { evaluatePassphraseStrength } from '../../lib/passphrase';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  RadioGroup,
  Checkbox,
  Field,
  Select,
  Dialog,
  Banner,
} from '../../components';

export interface SettingsViewProps {
  onSettingsChanged?: (settings: PlaintextSettings) => void;
  onNavigateHome?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSettingsChanged, onNavigateHome }) => {
  const { t, language, setLanguage } = useI18n();
  const { wipe, activeKey } = useVault();

  const [settings, setSettings] = useState<PlaintextSettings>({
    language: 'en',
    textSize: 'normal',
    highContrast: false,
    reducedMotion: false,
    camouflageMode: false,
    autoLockMinutes: 5,
    quickExitUrl: 'https://www.google.com',
    devanagariNumerals: false,
  });

  // Change Passphrase state
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [newPassphrase, setNewPassphrase] = useState('');
  const [confirmNewPassphrase, setConfirmNewPassphrase] = useState('');
  const [passphraseStatus, setPassphraseStatus] = useState<string | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Backup & Restore
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Demo Case state
  const [demoStatus, setDemoStatus] = useState<string | null>(null);

  // Emergency Wipe state
  const [isWipeOpen, setIsWipeOpen] = useState(false);
  const [wipeConfirmWord, setWipeConfirmWord] = useState('');
  const [isWiping, setIsWiping] = useState(false);

  // Informational modals
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  useEffect(() => {
    getSettings().then((s) => setSettings(s));
  }, []);

  const updateSetting = async <K extends keyof PlaintextSettings>(
    key: K,
    val: PlaintextSettings[K],
  ) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    await saveSettings(updated);
    onSettingsChanged?.(updated);

    if (key === 'highContrast') {
      if (val) {
        document.documentElement.setAttribute('data-contrast', 'high');
      } else {
        document.documentElement.removeAttribute('data-contrast');
      }
    }

    if (key === 'textSize') {
      document.documentElement.setAttribute('data-text-size', String(val));
    }

    if (key === 'reducedMotion') {
      document.documentElement.setAttribute('data-reduced-motion', String(val));
    }

    if (key === 'camouflageMode') {
      if (val) {
        document.title = 'Notes';
      } else {
        document.title = `${t('app.name')} | ${t('app.nativeName')}`;
      }
    }
  };

  // Change Passphrase
  const handleChangePassphrase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeKey) return;
    setPassphraseStatus(null);

    if (newPassphrase.length < 8) {
      setPassphraseStatus('New passphrase must be at least 8 characters long.');
      return;
    }
    if (newPassphrase !== confirmNewPassphrase) {
      setPassphraseStatus('Passphrase confirmation does not match.');
      return;
    }

    setIsChangingPass(true);
    try {
      await changeVaultPassphrase(activeKey, newPassphrase);
      setPassphraseStatus('Passphrase updated successfully! All records re-encrypted.');
      setTimeout(() => {
        setIsChangePassOpen(false);
        setNewPassphrase('');
        setConfirmNewPassphrase('');
        setPassphraseStatus(null);
      }, 1500);
    } catch (err) {
      console.error('Failed to change passphrase:', err);
      setPassphraseStatus('Failed to change passphrase. Please try again.');
    } finally {
      setIsChangingPass(false);
    }
  };

  // Backup Export
  const handleExportBackup = async () => {
    if (!activeKey) return;
    try {
      const backupJson = await exportEncryptedBackup(activeKey);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pratikar-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupStatus('Encrypted backup downloaded successfully.');
    } catch (err) {
      console.error('Export failed:', err);
      setBackupStatus('Export failed.');
    }
  };

  // Backup Restore
  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeKey) return;

    setIsRestoring(true);
    setBackupStatus(null);

    try {
      const text = await file.text();
      const res = await importEncryptedBackup(activeKey, text);
      setBackupStatus(`Successfully restored ${res.casesCount} case(s) and ${res.evidenceCount} evidence item(s).`);
    } catch (err) {
      setBackupStatus((err as Error).message || 'Failed to restore backup.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Demo Case Handlers
  const handleLoadDemo = async () => {
    if (!activeKey) return;
    setDemoStatus('Loading fictional demo case...');
    try {
      await loadDemoCase(activeKey);
      setDemoStatus('Demo case loaded successfully. Check your cases list!');
      onNavigateHome?.();
    } catch (err) {
      console.error(err);
      setDemoStatus('Failed to load demo data.');
    }
  };

  const handleRemoveDemo = async () => {
    if (!activeKey) return;
    setDemoStatus('Removing demo data...');
    try {
      await removeDemoCase(activeKey);
      setDemoStatus('Demo case removed cleanly.');
    } catch (err) {
      console.error(err);
      setDemoStatus('Failed to remove demo data.');
    }
  };

  // Emergency Wipe
  const handleConfirmWipe = async () => {
    if (wipeConfirmWord.trim().toUpperCase() !== 'DELETE') return;
    setIsWiping(true);
    try {
      await wipe();
    } catch (e) {
      console.error(e);
    } finally {
      setIsWiping(false);
      setIsWipeOpen(false);
      window.location.reload();
    }
  };

  const passStrength = evaluatePassphraseStrength(newPassphrase);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{t('settings.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      {/* Language Section */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold">{t('settings.languageTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            name="language"
            label="Language Selection"
            value={language}
            onChange={(val) => {
              const lang = val as 'en' | 'hi' | 'mr';
              setLanguage(lang);
              updateSetting('language', lang);
            }}
            options={[
              { value: 'en', label: 'English' },
              { value: 'hi', label: 'हिंदी (Hindi)' },
              { value: 'mr', label: 'मराठी (Marathi)' },
            ]}
          />
        </CardContent>
      </Card>

      {/* Accessibility & Visual Sizing */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold">Accessibility &amp; Visual Sizing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            name="textSize"
            label="Font Scale"
            value={settings.textSize}
            onChange={(val) => updateSetting('textSize', val as TextSize)}
            options={[
              { value: 'normal', label: '100% Standard Text Size' },
              { value: 'large', label: '115% Large Text Size' },
              { value: 'xlarge', label: '130% Extra Large Text Size' },
            ]}
          />

          <div className="space-y-3 pt-3 border-t border-border/40">
            <Checkbox
              label={t('settings.highContrastLabel')}
              checked={settings.highContrast}
              onChange={(e) => updateSetting('highContrast', e.target.checked)}
            />
            <Checkbox
              label={t('settings.reducedMotionLabel')}
              checked={settings.reducedMotion}
              onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Auto-Lock & Panic Quick Exit (Section 8.11 & 8.12) */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold">Security, Auto-Lock &amp; Panic Exit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="Inactivity Auto-Lock Duration"
            value={String(settings.autoLockMinutes ?? 5)}
            onChange={(e) => updateSetting('autoLockMinutes', Number(e.target.value))}
            options={[
              { value: '1', label: '1 Minute (High Security)' },
              { value: '5', label: '5 Minutes (Recommended Default)' },
              { value: '15', label: '15 Minutes' },
              { value: '-1', label: 'Never (Recommended Against)' },
            ]}
          />

          <Field
            label="Quick-Exit Redirect URL"
            value={settings.quickExitUrl || 'https://www.google.com'}
            onChange={(e) => updateSetting('quickExitUrl', e.target.value)}
            placeholder="https://www.google.com"
            hint="Pressing Quick Exit (or hitting Escape twice) immediately wipes active encryption keys and redirects to this site."
          />

          <div className="pt-2">
            <Checkbox
              label="Disguise Mode (Neutral In-App Title)"
              checked={settings.camouflageMode}
              onChange={(e) => updateSetting('camouflageMode', e.target.checked)}
            />
            <p className="text-[11px] text-muted-foreground pt-1 pl-6">
              Changes browser tab title to &quot;Notes&quot;. Note: Installed PWA app icons on your home screen cannot be changed at runtime.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Vault Key Management & Backup */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold">Vault Credentials &amp; Encrypted Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2.5">
            <Button variant="secondary" onClick={() => setIsChangePassOpen(true)}>
              🔑 Change Passphrase
            </Button>
            <Button variant="outline" onClick={handleExportBackup}>
              ⬇️ Export Encrypted Backup (.json)
            </Button>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/40">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Restore from Backup (.json):
            </span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreBackup}
              disabled={isRestoring}
              className="text-xs text-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface file:text-foreground hover:file:bg-surface/80 cursor-pointer"
            />
            {isRestoring && <p className="text-xs text-primary">Restoring records...</p>}
          </div>

          {backupStatus && (
            <p className="text-xs text-primary font-medium" role="status">
              {backupStatus}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Demo Mode (Section 20) */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">Evaluator Demo Mode</CardTitle>
            <span className="text-xs font-mono text-muted-foreground">Section 20</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Quickly test the complete statutory takedown workflow with fictional data (no real names, example.com links, pending countdown, and overdue escalation).
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Button variant="secondary" onClick={handleLoadDemo}>
              Load Demo Case
            </Button>
            <Button variant="ghost" onClick={handleRemoveDemo}>
              Remove Demo Data
            </Button>
          </div>
          {demoStatus && <p className="text-xs text-primary">{demoStatus}</p>}
        </CardContent>
      </Card>

      {/* About & Policies */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold">About &amp; Security Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground">
          <p>
            <strong>Pratikar v1.0.0</strong> — Built in accordance with Rule 3(2)(b) of the IT Rules 2021 and the MeitY NCII SOP (issued 11 November 2025).
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setIsSecurityModalOpen(true)}>
              How Your Data is Protected
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsPrivacyModalOpen(true)}>
              Privacy Policy Statement
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Wipe Card */}
      <Card className="border-danger/40 bg-danger/5">
        <CardHeader>
          <CardTitle className="text-base font-bold text-danger">Emergency Data Purge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Instantly and irreversibly delete all local cases, evidence ledgers, and settings from this device.
          </p>
          <Button variant="danger" onClick={() => setIsWipeOpen(true)}>
            Wipe All Data from This Device
          </Button>
        </CardContent>
      </Card>

      {/* Modal: Change Passphrase */}
      <Dialog
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
        title="Change Vault Passphrase"
        description="Re-encrypts all database records with a new PBKDF2/AES-GCM key."
      >
        <form onSubmit={handleChangePassphrase} className="space-y-4">
          <Field
            label="New Passphrase (min 8 characters)"
            type="password"
            required
            value={newPassphrase}
            onChange={(e) => setNewPassphrase(e.target.value)}
            placeholder="••••••••"
            hint="Tip: Using four random words provides maximum strength and memory retention."
          />

          {newPassphrase.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Strength: <strong className="capitalize">{passStrength.level}</strong>
            </div>
          )}

          <Field
            label="Confirm New Passphrase"
            type="password"
            required
            value={confirmNewPassphrase}
            onChange={(e) => setConfirmNewPassphrase(e.target.value)}
            placeholder="••••••••"
          />

          {passphraseStatus && (
            <p className="text-xs font-medium text-primary">{passphraseStatus}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsChangePassOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isChangingPass}>
              Update &amp; Re-encrypt All
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal: Double Confirmation Wipe */}
      <Dialog
        isOpen={isWipeOpen}
        onClose={() => setIsWipeOpen(false)}
        title="Confirm Irreversible Data Wipe"
        description="Permanently delete all cryptographic keys, records, and evidence on this device."
      >
        <div className="space-y-4">
          <Banner variant="danger" title="Warning: No Data Recovery">
            Once confirmed, this device&apos;s IndexedDB stores and encryption keys will be permanently destroyed.
          </Banner>

          <div className="space-y-2">
            <label htmlFor="settings-wipe-confirm-input" className="block text-xs font-semibold text-foreground/90 uppercase tracking-wider">
              Type &quot;DELETE&quot; to confirm:
            </label>
            <input
              id="settings-wipe-confirm-input"
              type="text"
              value={wipeConfirmWord}
              onChange={(e) => setWipeConfirmWord(e.target.value)}
              placeholder="DELETE"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-danger"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setIsWipeOpen(false);
                setWipeConfirmWord('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={wipeConfirmWord.trim().toUpperCase() !== 'DELETE'}
              isLoading={isWiping}
              onClick={handleConfirmWipe}
            >
              Permanently Delete Everything
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal: Privacy Statement */}
      <Dialog
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        title="Privacy Statement"
        description="Our zero-knowledge commitment"
      >
        <div className="space-y-3 text-xs leading-relaxed text-foreground/90">
          <p>
            <strong>What is collected:</strong> Absolutely nothing is transmitted over the network. No telemetry, analytics, cookies, or remote logging.
          </p>
          <p>
            <strong>Where data lives:</strong> All cases, links, and evidence entries reside strictly within your local browser storage, protected by AES-GCM-256 encryption.
          </p>
          <p>
            <strong>Retention:</strong> Data persists solely on this device until you explicitly choose to wipe it or clear your browser site data.
          </p>
        </div>
      </Dialog>

      {/* Modal: Security Architecture */}
      <Dialog
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        title="How Your Data is Protected"
        description="Cryptographic details"
      >
        <div className="space-y-3 text-xs leading-relaxed text-foreground/90">
          <p>
            • <strong>Key Derivation:</strong> PBKDF2-HMAC-SHA256 with 600,000 iterations and a 16-byte cryptographically random salt.
          </p>
          <p>
            • <strong>Encryption:</strong> AES-256-GCM with unique 12-byte initialization vectors (IV) for every record.
          </p>
          <p>
            • <strong>Tamper-Evident Ledger:</strong> SHA-256 hash chain with canonicalized JSON serialization for evidence integrity.
          </p>
        </div>
      </Dialog>
    </div>
  );
};
