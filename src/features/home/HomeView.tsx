import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useVault } from '../vault/VaultContext';
import { getCases, getReportsByCase } from '../../lib/storage';
import type { CaseRecord, ReportRecord } from '../../types';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '../../components';

export interface HomeViewProps {
  onSelectCase: (c: CaseRecord) => void;
  onNavigateNewCase: () => void;
  onNavigateHelplines: () => void;
  onNavigateEvidenceHasher: () => void;
}

interface CaseWithReports {
  caseRecord: CaseRecord;
  pendingReports: ReportRecord[];
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectCase,
  onNavigateNewCase,
  onNavigateHelplines,
  onNavigateEvidenceHasher,
}) => {
  const { t } = useI18n();
  const { activeKey } = useVault();

  const [casesWithReports, setCasesWithReports] = useState<CaseWithReports[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'assisted'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!activeKey) return;
    setIsLoading(true);
    try {
      const allCases = await getCases(activeKey);
      const items: CaseWithReports[] = [];

      for (const c of allCases) {
        const reps = await getReportsByCase(c.id, activeKey);
        const pending = reps.filter((r) => r.outcome === 'pending');
        items.push({ caseRecord: c, pendingReports: pending });
      }

      setCasesWithReports(items);
    } catch (err) {
      console.error('Failed to load dashboard cases:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute remaining hours / minutes for pending report chip
  const formatTimeRemaining = (dueAtIso: string): string => {
    const diffMs = new Date(dueAtIso).getTime() - Date.now();
    if (diffMs <= 0) {
      return 'Deadline passed';
    }
    const h = Math.floor(diffMs / (1000 * 60 * 60));
    const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m remaining`;
  };

  const filteredCases = casesWithReports.filter((item) => {
    if (filterMode === 'assisted') {
      return item.caseRecord.mode === 'assisted';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome / Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            24-Hour Redress Action Guide
          </h1>
          <p className="text-sm text-muted-foreground pt-1">
            {t('app.name')} • {t('app.nativeName')} — Privacy-first incident management & statutory 24-hour takedown assistance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button onClick={onNavigateNewCase}>
            + New Incident Case
          </Button>
          <Button variant="secondary" onClick={onNavigateHelplines}>
            🛡️ Helplines
          </Button>
          <Button variant="outline" onClick={onNavigateEvidenceHasher}>
            # Hash a File
          </Button>
        </div>
      </div>

      {/* Filter / Mode Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            View:
          </span>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              filterMode === 'all'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'bg-surface text-muted-foreground hover:text-foreground'
            }`}
          >
            All Cases ({casesWithReports.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('assisted')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              filterMode === 'assisted'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'bg-surface text-muted-foreground hover:text-foreground'
            }`}
          >
            Helping Someone ({casesWithReports.filter((c) => c.caseRecord.mode === 'assisted').length})
          </button>
        </div>
      </div>

      {/* Empty State */}
      {!isLoading && filteredCases.length === 0 && (
        <Card variant="muted" className="p-8 sm:p-12 text-center space-y-4 border-dashed border-border/80">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl">
            🛡️
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-foreground">
              You are safe here. Everything stays on this device.
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No incident case has been created yet. When you are ready, follow our calm step-by-step wizard to document threats, generate 24-hour takedown notices, and track removal deadlines.
            </p>
          </div>
          <div className="pt-2">
            <Button size="lg" onClick={onNavigateNewCase}>
              Create Your First Case →
            </Button>
          </div>
        </Card>
      )}

      {/* Case Cards List (Section 8.4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCases.map(({ caseRecord, pendingReports }) => {
          const isDemo = caseRecord.id.includes('demo');
          return (
            <Card
              key={caseRecord.id}
              className={`hover:border-primary/50 transition-all cursor-pointer shadow-sm ${
                isDemo ? 'border-amber-500/40 bg-amber-950/10' : 'border-border'
              }`}
              onClick={() => onSelectCase(caseRecord)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base sm:text-lg font-bold">
                      {caseRecord.nickname}
                    </CardTitle>
                    {isDemo && (
                      <Badge variant="warning" size="sm">
                        DEMO DATA
                      </Badge>
                    )}
                  </div>
                  <Badge
                    variant={
                      caseRecord.status === 'active'
                        ? 'info'
                        : caseRecord.status === 'resolved'
                          ? 'success'
                          : 'default'
                    }
                    size="sm"
                  >
                    {caseRecord.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    Mode: <strong>{caseRecord.mode === 'assisted' ? `Helper (${caseRecord.helperName || 'Volunteer'})` : 'Self'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Platforms: <strong>{caseRecord.platforms.join(', ') || 'None specified'}</strong>
                  </span>
                </div>

                {/* Pending Takedown Countdown Chips (Section 8.4) */}
                {pendingReports.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                      Statutory 24-Hour Countdown:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {pendingReports.map((rep) => {
                        const remaining = formatTimeRemaining(rep.dueAt);
                        const isOverdue = remaining.includes('passed');
                        return (
                          <div
                            key={rep.id}
                            className={`rounded-md px-2.5 py-1 text-xs font-mono font-medium border ${
                              isOverdue
                                ? 'bg-warning-surface/30 border-warning text-warning'
                                : 'bg-primary/10 border-primary/40 text-primary'
                            }`}
                          >
                            ⏱️ {rep.platform}: {remaining}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <span className="text-muted-foreground">
                    Next Action: <span className="text-foreground font-medium">Review Redress Action Plan →</span>
                  </span>
                  <span className="text-primary font-semibold">Open Case</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
