import React from 'react';
import { Navigation } from './Navigation';
import { useI18n } from '../lib/i18n';

export interface LayoutProps {
  children: React.ReactNode;
  isCamouflage: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, isCamouflage }) => {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navigation isCamouflage={isCamouflage} />

      <main className="flex-1 pb-16 pt-4 sm:pt-6">
        <div className="mx-auto max-w-6xl px-4">{children}</div>
      </main>

      <footer className="no-print border-t border-border/40 bg-surface/20 py-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 space-y-1">
          <p className="font-semibold text-foreground/80">
            {t('app.name')} • {t('app.nativeName')}
          </p>
          <p className="max-w-xl mx-auto">{t('app.disclaimerNotice')}</p>
          <p className="text-[11px] pt-1 opacity-70">{t('app.tamperNotice')}</p>
        </div>
      </footer>
    </div>
  );
};
