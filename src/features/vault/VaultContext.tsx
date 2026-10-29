import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { Vault } from '../../types';
import { createVault, unlockVault } from '../../lib/crypto';
import {
  getVaultMetadata,
  hasVault,
  saveVaultMetadata,
  logAuditEvent,
  wipeAllData,
  getSettings,
} from '../../lib/storage';

export interface VaultContextType {
  isInitialized: boolean;
  isUnlocked: boolean;
  activeKey: CryptoKey | null;
  initVault: (passphrase: string) => Promise<boolean>;
  unlock: (passphrase: string) => Promise<boolean>;
  lock: (broadcast?: boolean) => void;
  triggerQuickExit: () => Promise<void>;
  wipe: () => Promise<void>;
  isLoading: boolean;
  isStorageAvailable: boolean;
}

const VaultContext = createContext<VaultContextType | null>(null);

const BROADCAST_CHANNEL_NAME = 'pratikar_vault_channel';

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [activeKey, setActiveKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStorageAvailable, setIsStorageAvailable] = useState<boolean>(true);

  const idleTimerRef = useRef<number | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const lock = useCallback((broadcast = true) => {
    setActiveKey(null);
    logAuditEvent('lock');
    if (broadcast && broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type: 'LOCK' });
      } catch {
        // BroadcastChannel may fail in restricted sandboxes
      }
    }
  }, []);

  const triggerQuickExit = useCallback(async () => {
    lock(true);
    let destination = 'https://www.google.com';
    try {
      const settings = await getSettings();
      if (settings.quickExitUrl) {
        destination = settings.quickExitUrl;
      }
    } catch {
      // Fallback destination on storage error
    }
    // Replace history entry so browser Back does not re-open the app
    window.location.replace(destination);
  }, [lock]);

  const resetIdleTimer = useCallback(async () => {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
    }
    if (!activeKey) return;

    try {
      const settings = await getSettings();
      const minutes = settings.autoLockMinutes ?? 5;
      if (minutes <= 0) {
        return; // 'never' selected
      }
      idleTimerRef.current = window.setTimeout(() => {
        lock(true);
      }, minutes * 60 * 1000);
    } catch {
      // Default fallback 5 minutes
      idleTimerRef.current = window.setTimeout(() => {
        lock(true);
      }, 5 * 60 * 1000);
    }
  }, [activeKey, lock]);

  // Set up BroadcastChannel for multi-tab lock
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        bc.onmessage = (event) => {
          if (event.data?.type === 'LOCK') {
            lock(false);
          }
        };
        broadcastChannelRef.current = bc;
      } catch {
        // Fallback for environments without BroadcastChannel
      }
    }

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, [lock]);

  // Global Double-Escape key listener for Panic / Quick Exit
  useEffect(() => {
    let lastEscapeTime = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const openDialog = document.querySelector('dialog[open]');
        // If a modal dialog is open, let the first Escape close the dialog
        if (openDialog) {
          return;
        }

        const now = Date.now();
        if (now - lastEscapeTime < 500) {
          triggerQuickExit();
        }
        lastEscapeTime = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerQuickExit]);

  // Load vault initialization state on mount
  useEffect(() => {
    hasVault()
      .then((exists) => {
        setIsInitialized(exists);
        setIsStorageAvailable(true);
      })
      .catch(() => {
        setIsStorageAvailable(false);
        setIsInitialized(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Set up idle tracking and pagehide listeners when unlocked
  useEffect(() => {
    if (!activeKey) return;

    resetIdleTimer();

    const handleUserActivity = () => {
      resetIdleTimer();
    };
    const handleVisibilityChange = () => {
      // Auto-lock when tab is hidden or backgrounded
      if (document.visibilityState === 'hidden') {
        lock(true);
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
        triggerQuickExit,
        wipe,
        isLoading,
        isStorageAvailable,
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

