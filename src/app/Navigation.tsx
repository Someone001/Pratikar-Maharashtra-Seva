import React from 'react';
import { NavLink } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { useVault } from '../features/vault/VaultContext';
import { PanicButton } from '../components/PanicButton';

export interface NavigationProps {
  isCamouflage: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ isCamouflage }) => {
  const { t } = useI18n();
  const { lock } = useVault();

  const navLinks = [
    { to: '/', label: t('nav.wizard'), icon: '⚡' },
    { to: '/cases', label: t('nav.cases'), icon: '📁' },
    { to: '/evidence', label: t('nav.evidence'), icon: '🛡️' },
    { to: '/reports', label: '24h Notices', icon: '⏱️' },
    { to: '/documents', label: 'Summary', icon: '📄' },
    { to: '/helplines', label: t('nav.helplines'), icon: '📞' },
    { to: '/settings', label: t('nav.settings'), icon: '⚙️' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:py-3">
        {/* Brand / Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-sm">
            {isCamouflage ? '📝' : 'प्र'}
          </div>
          <div>
            <span className="font-bold tracking-tight text-foreground text-sm sm:text-base block">
              {isCamouflage ? t('app.camouflageTitle') : t('app.nativeName')}
            </span>
            {!isCamouflage && (
              <span className="text-[10px] text-muted-foreground block -mt-0.5">
                {t('app.name')} • 24h Redress
              </span>
            )}
          </div>
        </NavLink>

        {/* Right side controls: Lock + Quick Exit */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={lock}
            title={t('nav.lockVault')}
            aria-label={t('nav.lockVault')}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-surface/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="hidden sm:inline">{t('nav.lockVault')}</span>
          </button>

          <PanicButton />
        </div>
      </div>

      {/* Primary Navigation Bar */}
      <nav aria-label="Main Navigation" className="border-t border-border/40 bg-surface/30 overflow-x-auto">
        <div className="mx-auto flex max-w-6xl px-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary font-bold bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-surface/50'
                }`
              }
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
};
