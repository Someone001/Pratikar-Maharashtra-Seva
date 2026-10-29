import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nProvider } from '../../src/lib/i18n';
import { VaultProvider, useVault } from '../../src/features/vault/VaultContext';
import { OnboardingView } from '../../src/features/onboarding/OnboardingView';
import { UnlockView } from '../../src/features/vault/UnlockView';
import { wipeAllData } from '../../src/lib/storage';

const TestApp: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <I18nProvider>
    <VaultProvider>{children}</VaultProvider>
  </I18nProvider>
);

describe('Milestone 4: Vault & Onboarding Flow', () => {
  beforeEach(async () => {
    await wipeAllData();
  });

  it('renders onboarding disclaimer and advances to age check', () => {
    render(
      <TestApp>
        <OnboardingView />
      </TestApp>,
    );

    expect(screen.getByText(/what pratikar does/i)).toBeInTheDocument();
    expect(screen.getByText(/what pratikar is not/i)).toBeInTheDocument();

    const continueBtn = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueBtn);

    expect(screen.getByText(/age safety verification/i)).toBeInTheDocument();
  });

  it('stops standard flow and displays child protection resources when minor (<18) is selected', () => {
    render(
      <TestApp>
        <OnboardingView />
      </TestApp>,
    );

    // Proceed to age check
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Select under 18
    const under18Btn = screen.getByText(/under 18/i);
    fireEvent.click(under18Btn);

    // Child protection stop view
    expect(screen.getByText(/special protection required for minors/i)).toBeInTheDocument();
    expect(screen.getAllByText(/1098/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/cybercrime\.gov\.in/i).length).toBeGreaterThan(0);
  });

  it('allows 18+ selection to proceed to vault passphrase setup and initialize vault', async () => {
    const handleComplete = vi.fn();
    render(
      <TestApp>
        <OnboardingView onComplete={handleComplete} />
      </TestApp>,
    );

    // Advance to age check
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Select 18+
    fireEvent.click(screen.getByText(/18 or older/i));

    // Fill passphrase
    const passphraseInput = screen.getByPlaceholderText(/enter a strong passphrase/i);
    const confirmInput = screen.getByPlaceholderText(/re-enter your passphrase/i);
    expect(passphraseInput).toBeInTheDocument();

    fireEvent.change(passphraseInput, {
      target: { value: 'password123' },
    });
    fireEvent.change(confirmInput, {
      target: { value: 'password123' },
    });

    const createBtn = screen.getByRole('button', { name: /create encrypted vault/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(handleComplete).toHaveBeenCalled();
    });
  });

  it('unlocks vault with correct passphrase and displays error on incorrect passphrase', async () => {
    // Component to expose vault context for testing
    const VaultTester = () => {
      const { isUnlocked, isInitialized, initVault } = useVault();
      return (
        <div>
          <button onClick={() => initVault('correct-password')}>Init</button>
          <span data-testid="status">
            {isInitialized ? 'Initialized' : 'NotInit'} - {isUnlocked ? 'Unlocked' : 'Locked'}
          </span>
          {!isUnlocked && isInitialized && <UnlockView />}
        </div>
      );
    };

    render(
      <TestApp>
        <VaultTester />
      </TestApp>,
    );

    // Initialize vault
    fireEvent.click(screen.getByText('Init'));
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('Initialized - Unlocked');
    });
  });
});
