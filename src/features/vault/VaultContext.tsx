import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { Vault } from '../../types';
import { createVault, unlockVault } from '../../lib/crypto';
import {
  getVaultMetadata,
  hasVault,
  saveVaultMetadata,
  logAuditEvent,
  wipeAllData,
} from '../../lib/storage';

export interface VaultContextType {
  isInitialized: boolean;
  isUnlocked: boolean;
  activeKey: CryptoKey | null;
  initVault: (passphrase: string) => Promise<boolean>;
  unlock: (passphrase: string) => Promise<boolean>;
  lock: () => void;
  wipe: () => Promise<void>;
  isLoading: boolean;
}

const VaultContext = createContext<VaultContextType | null>(null);

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [activeKey, setActiveKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const idleTimerRef = useRef<number | null>(null);

  const lock = useCallback(() => {
    setActiveKey(null);
    logAuditEvent('lock');
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
    }
    if (activeKey) {
      idleTimerRef.current = window.setTimeout(() => {
        lock();
      }, IDLE_TIMEOUT_MS);
    }
  }, [activeKey, lock]);

  // Load vault initialization state on mount
  useEffect(() => {
    hasVault()
      .then((exists) => {
        setIsInitialized(exists);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Set up idle tracking and pagehide listeners when unlocked
  useEffect(() => {
    if (!activeKey) return;

    resetIdleTimer();

    const handleUserActivity = () => resetIdleTimer();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        lock();
      }
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeKey, resetIdleTimer, lock]);

  const initVault = async (passphrase: string): Promise<boolean> => {
    try {
      const { vault, key } = await createVault(passphrase);
      await saveVaultMetadata(vault);
      setActiveKey(key);
      setIsInitialized(true);
      await logAuditEvent('unlock');
      return true;
    } catch (err) {
      console.error('Failed to initialize vault:', err);
      return false;
    }
  };

  const unlock = async (passphrase: string): Promise<boolean> => {
    try {
      const vault: Vault | null = await getVaultMetadata();
      if (!vault) return false;

      const key = await unlockVault(passphrase, vault);
      if (key) {
        setActiveKey(key);
        await logAuditEvent('unlock');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to unlock vault:', err);
      return false;
    }
  };

  const wipe = async (): Promise<void> => {
    await logAuditEvent('wipe');
    await wipeAllData();
    setActiveKey(null);
    setIsInitialized(false);
  };

  const isUnlocked = activeKey !== null;

  return (
    <VaultContext.Provider
      value={{
        isInitialized,
        isUnlocked,
        activeKey,
        initVault,
        unlock,
        lock,
        wipe,
        isLoading,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export function useVault(): VaultContextType {
  const ctx = useContext(VaultContext);
  if (!ctx) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return ctx;
}
