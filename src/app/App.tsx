import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { useVault } from '../features/vault/VaultContext';
import { useI18n } from '../lib/i18n';
import { getSettings, getCases } from '../lib/storage';
import type { CaseRecord, PlaintextSettings } from '../types';
import { Layout } from './Layout';
import { OnboardingView } from '../features/onboarding/OnboardingView';
import { UnlockView } from '../features/vault/UnlockView';
import { HomeView } from '../features/home/HomeView';
import { NewCaseWizard } from '../features/cases/NewCaseWizard';
import { CaseDetailView } from '../features/cases/CaseDetailView';
import { ActionWizard } from '../features/wizard/ActionWizard';
import { CaseManager } from '../features/cases/CaseManager';
import { ReportsView } from '../features/reports/ReportsView';
import { EvidenceLedgerView } from '../features/evidence/EvidenceLedgerView';
import { PrintableSummary } from '../features/documents/PrintableSummary';
import { HelplinesView } from '../features/resources/HelplinesView';
import { SettingsView } from '../features/settings/SettingsView';

// Case Detail Wrapper component that retrieves case by URL parameter
const CaseDetailRouteWrapper: React.FC<{ activeCase: CaseRecord | null; onSelectCase: (c: CaseRecord) => void }> = ({
  activeCase,
  onSelectCase,
}) => {
  const { id } = useParams<{ id: string }>();
  const { activeKey } = useVault();
  const navigate = useNavigate();
  const [loadedCase, setLoadedCase] = useState<CaseRecord | null>(activeCase);

  useEffect(() => {
    if (activeCase && activeCase.id === id) {
      setLoadedCase(activeCase);
      return;
    }
    if (!activeKey || !id) return;
    getCases(activeKey).then((cases) => {
      const found = cases.find((c) => c.id === id);
      if (found) {
        setLoadedCase(found);
        onSelectCase(found);
      } else {
        navigate('/cases');
      }
    });
  }, [id, activeKey, activeCase, onSelectCase, navigate]);

  if (!loadedCase) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Loading case details...</div>;
  }

  return <CaseDetailView caseRecord={loadedCase} onBack={() => navigate('/cases')} />;
};

const AppContent: React.FC = () => {
  const { isInitialized, isUnlocked, activeKey, isLoading } = useVault();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [activeCase, setActiveCase] = useState<CaseRecord | null>(null);
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

  const loadInitialSettings = useCallback(async () => {
    const s = await getSettings();
    setSettings(s);
    if (s.highContrast) {
      document.documentElement.setAttribute('data-contrast', 'high');
    }
    if (s.textSize !== 'normal') {
      document.documentElement.setAttribute('data-text-size', s.textSize);
    }
    if (s.reducedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    }
    if (s.camouflageMode) {
      document.title = 'Notes';
    }
  }, []);

  const loadCases = useCallback(async () => {
    if (!activeKey) return;
    try {
      const allCases = await getCases(activeKey);
      if (allCases.length > 0 && (!activeCase || !allCases.some((c) => c.id === activeCase.id))) {
        setActiveCase(allCases[0] ?? null);
      }
    } catch (err) {
      console.error('Failed to load active case:', err);
    }
  }, [activeKey, activeCase]);

  useEffect(() => {
    loadInitialSettings();
  }, [loadInitialSettings]);

  useEffect(() => {
    if (isUnlocked) {
      loadCases();
    }
  }, [isUnlocked, loadCases]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-2">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return <OnboardingView onComplete={() => navigate('/')} />;
  }

  if (!isUnlocked) {
    return <UnlockView />;
  }

  return (
    <Layout isCamouflage={settings.camouflageMode}>
      <Routes>
        <Route
          path="/"
          element={
            <HomeView
              onSelectCase={(c) => {
                setActiveCase(c);
                navigate(`/case/${c.id}`);
              }}
              onNavigateNewCase={() => navigate('/cases/new')}
              onNavigateHelplines={() => navigate('/helplines')}
              onNavigateEvidenceHasher={() => navigate('/evidence')}
            />
          }
        />
        <Route
          path="/cases"
          element={
            <CaseManager
              activeCaseId={activeCase?.id || null}
              onSelectCase={(c) => {
                setActiveCase(c);
                navigate(`/case/${c.id}`);
              }}
            />
          }
        />
        <Route
          path="/cases/new"
          element={
            <NewCaseWizard
              onCaseCreated={(created) => {
                setActiveCase(created);
                navigate(`/case/${created.id}`);
              }}
              onCancel={() => navigate('/cases')}
            />
          }
        />
        <Route
          path="/case/:id"
          element={
            <CaseDetailRouteWrapper
              activeCase={activeCase}
              onSelectCase={(c) => setActiveCase(c)}
            />
          }
        />
        <Route
          path="/wizard"
          element={
            <ActionWizard
              activeCase={activeCase}
              onNavigateToEvidence={() => navigate('/evidence')}
              onNavigateToReports={() => navigate('/reports')}
              onNavigateToSummary={() => navigate('/documents')}
            />
          }
        />
        <Route path="/reports" element={<ReportsView activeCase={activeCase} />} />
        <Route path="/evidence" element={<EvidenceLedgerView activeCase={activeCase} />} />
        <Route path="/documents" element={<PrintableSummary activeCase={activeCase} />} />
        <Route path="/helplines" element={<HelplinesView />} />
        <Route
          path="/settings"
          element={
            <SettingsView
              onSettingsChanged={(updated) => {
                setSettings(updated);
              }}
              onNavigateHome={() => navigate('/')}
            />
          }
        />
        <Route
          path="*"
          element={
            <HomeView
              onSelectCase={(c) => {
                setActiveCase(c);
                navigate(`/case/${c.id}`);
              }}
              onNavigateNewCase={() => navigate('/cases/new')}
              onNavigateHelplines={() => navigate('/helplines')}
              onNavigateEvidenceHasher={() => navigate('/evidence')}
            />
          }
        />
      </Routes>
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};
