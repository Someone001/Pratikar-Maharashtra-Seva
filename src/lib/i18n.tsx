import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { Language, PlaintextSettings } from '../types';
import enTranslations from '../locales/en.json';
import hiTranslations from '../locales/hi.json';
import mrTranslations from '../locales/mr.json';
import { getSettings, saveSettings } from './storage';

const translationsMap: Record<Language, Record<string, unknown>> = {
  en: enTranslations as unknown as Record<string, unknown>,
  hi: hiTranslations as unknown as Record<string, unknown>,
  mr: mrTranslations as unknown as Record<string, unknown>,
};

export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

function resolveDeepKey(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load stored language preference
    getSettings().then((settings) => {
      setLanguageState(settings.language);
      document.documentElement.lang = settings.language;
    });
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    document.documentElement.lang = newLang;
    const current = await getSettings();
    const updated: PlaintextSettings = { ...current, language: newLang };
    await saveSettings(updated);
  };

  const t = useMemo(() => {
    const currentTranslations = translationsMap[language] || translationsMap.en;
    const fallbackTranslations = translationsMap.en;

    return (key: string, params?: Record<string, string | number>): string => {
      let text = resolveDeepKey(currentTranslations, key);
      if (!text) {
        text = resolveDeepKey(fallbackTranslations, key) ?? key;
      }

      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
        }
      }

      return text;
    };
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}

