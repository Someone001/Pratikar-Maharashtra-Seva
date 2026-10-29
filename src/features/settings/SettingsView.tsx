import React, { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useVault } from '../vault/VaultContext';
import {
  getSettings,
  saveSettings,
  type VaultLockedError,
} from '../../lib/storage';
import type { PlaintextSettings, TextSize } from '../../types';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  RadioGroup,
  Checkbox,
  Dialog,
  Banner,
} from '../../components';

export interface SettingsViewProps {
  onSettingsChanged?: (settings: PlaintextSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSettingsChanged }) => {
  const { t, language, setLanguage } = useI18n();
  const { wipe } = useVault();

  const [settings, setSettings] = useState<PlaintextSettings>({
    language: 'en',
    textSize: 'normal',
    highContrast: false,
    reducedMotion: false,
    camouflageMode: false,
  });

  const [isWipeOpen, setIsWipeOpen] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

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

    // Apply document level attributes
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
        document.title = t('app.camouflageTitle');
      } else {
        document.title = `${t('app.name')} | ${t('app.nativeName')}`;
      }
    }
  };

  const handleConfirmWipe = async () => {
    setIsWiping(true);
    try {
      await wipe();
    } catch (e) {
      console.error(e as VaultLockedError);
    } finally {
      setIsWiping(false);
      setIsWipeOpen(false);
      window.location.reload();
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      {/* Language Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.language')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'en', label: 'English' },
              { id: 'hi', label: 'हिंदी (Hindi)' },
              { id: 'mr', label: 'मराठी (Marathi)' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLanguage(item.id as 'en' | 'hi' | 'mr')}
                className={`rounded-lg border p-3 text-center text-sm font-medium transition-all ${
                  language === item.id
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border bg-surface/30 text-foreground hover:bg-surface'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accessibility & Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accessibility & Comfort</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            name="text-size"
            label={t('settings.textSize')}
            value={settings.textSize}
            onChange={(val) => updateSetting('textSize', val as TextSize)}
            options={[
              { value: 'normal', label: t('settings.textNormal') },
              { value: 'large', label: t('settings.textLarge') },
              { value: 'xlarge', label: t('settings.textXLarge') },
            ]}
          />

          <div className="pt-2 border-t border-border/40 space-y-3">
            <Checkbox
              label={t('settings.highContrast')}
              description="Increases contrast for readability in direct sunlight or for visual impairments"
              checked={settings.highContrast}
              onChange={(e) => updateSetting('highContrast', e.target.checked)}
            />

            <Checkbox
              label={t('settings.reducedMotion')}
              description="Disables transitions and animations to minimize motion sensitivity"
              checked={settings.reducedMotion}
              onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Camouflage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Discretion & Device Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Checkbox
            label={t('settings.camouflage')}
            description={t('settings.camouflageDesc')}
            checked={settings.camouflageMode}
            onChange={(e) => updateSetting('camouflageMode', e.target.checked)}
          />

          <div className="pt-4 border-t border-border/40 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-danger">Emergency Purge</h4>
              <p className="text-xs text-muted-foreground">
                Instantly delete the local database, all evidence, and settings.
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setIsWipeOpen(true)}>
              {t('settings.clearAll')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About & Verification */}
      <Card variant="muted">
        <CardContent className="text-xs text-muted-foreground space-y-1 pt-4">
          <p className="font-semibold text-foreground">
            {t('app.name')} • {t('settings.version')}: 1.0.0
          </p>
          <p>{t('app.disclaimerNotice')}</p>
          <p>{t('app.tamperNotice')}</p>
        </CardContent>
      </Card>

      {/* Wipe Confirmation Dialog */}
      <Dialog
        isOpen={isWipeOpen}
        onClose={() => setIsWipeOpen(false)}
        title={t('vault.wipeConfirmTitle')}
        maxWidth="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsWipeOpen(false)}>
              {t('vault.cancel')}
            </Button>
            <Button variant="danger" isLoading={isWiping} onClick={handleConfirmWipe}>
              {t('vault.wipeConfirmAction')}
            </Button>
          </div>
        }
      >
        <Banner variant="danger" title="Warning">
          {t('vault.wipeConfirmBody')}
        </Banner>
      </Dialog>
    </div>
  );
};
