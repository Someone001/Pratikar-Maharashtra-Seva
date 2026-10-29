import React, { useState, useEffect } from 'react';
import { useI18n } from '../../lib/i18n';
import { useVault } from '../vault/VaultContext';
import { getLinksByCase, saveReport, getReportsByCase } from '../../lib/storage';
import type { CaseRecord, LinkRecord, ReportRecord } from '../../types';
import planStepsData from '../../data/plan-steps.json';
import platformsData from '../../data/platforms.json';
import { generate24HourComplaint } from '../../lib/templates';
import { generate24HourIcsFile, downloadIcsFile } from '../../lib/ics';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Stepper,
  Badge,
  Banner,
  CopyButton,
  Countdown,
} from '../../components';

export interface ActionWizardProps {
  activeCase: CaseRecord | null;
  onNavigateToEvidence?: () => void;
  onNavigateToReports?: () => void;
  onNavigateToSummary?: () => void;
}

export const ActionWizard: React.FC<ActionWizardProps> = ({
  activeCase,
  onNavigateToEvidence,
  onNavigateToReports,
  onNavigateToSummary,
}) => {
  const { t, language } = useI18n();
  const { activeKey } = useVault();

  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>('instagram');
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);

  useEffect(() => {
    if (!activeCase || !activeKey) return;
    getLinksByCase(activeCase.id, activeKey).then(setLinks);
    getReportsByCase(activeCase.id, activeKey).then(setReports);

    if (activeCase.platforms[0]) {
      setSelectedPlatformId(activeCase.platforms[0]);
    }
  }, [activeCase, activeKey]);

  if (!activeCase) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t('wizard.title')}
          </h1>
          <p className="text-sm text-muted-foreground pt-1">
            {t('wizard.subtitle')}
          </p>
        </div>
        <Card variant="muted" className="p-8 text-center space-y-4 border-border">
          <p className="text-sm text-muted-foreground">
            Please select or create an incident case first to view customized redress guidance.
          </p>
          <div>
            <Button onClick={() => { window.location.hash = '#/cases'; }}>
              Create or Select an Incident Case →
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentStepData = planStepsData[activeStep] || planStepsData[0];
  const selectedPlatform = platformsData.find((p) => p.id === selectedPlatformId) || platformsData[0];

  const stepperItems = planStepsData.map((step) => ({
    id: step.id,
    title: step.title[language] || step.title.en,
  }));

  const complaintNotice = generate24HourComplaint({
    caseRecord: activeCase,
    platformName: selectedPlatform?.displayName || 'Platform',
    links: links.filter((l) => l.platform.toLowerCase() === selectedPlatformId.toLowerCase()),
    language,
    grievanceOfficerEmail: undefined,
  });

  const markStepDone = (idx: number) => {
    setCompletedSteps((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
    if (idx < planStepsData.length - 1) {
      setActiveStep(idx + 1);
    }
  };

  const handleQuickLogNotice = async () => {
    if (!activeKey) return;
    const now = new Date();
    const newReport: ReportRecord = {
      id: crypto.randomUUID(),
      caseId: activeCase.id,
      platform: selectedPlatform?.displayName || 'Platform',
      channel: 'platform',
      submittedAt: now.toISOString(),
      dueAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      linkIds: links.map((l) => l.id),
      outcome: 'pending',
    };

    await saveReport(newReport, activeKey);
    const updated = await getReportsByCase(activeCase.id, activeKey);
    setReports(updated);
    markStepDone(2);
    setActiveStep(3); // Advance to deadline tracking
  };

  const handleDownloadIcs = (rep: ReportRecord) => {
    const icsContent = generate24HourIcsFile({
      platformName: rep.platform,
      submittedAt: rep.submittedAt,
      referenceNumber: rep.referenceNumber,
    });
    downloadIcsFile(`takedown-deadline-${rep.platform}.ics`, icsContent);
  };

  const latestReport = reports[0];

  return (
    <div className="space-y-6">
      {/* Header and Case context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('wizard.title')}</h2>
          <p className="text-xs text-muted-foreground">{t('wizard.subtitle')}</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start sm:self-center">
          <Badge variant="info" size="sm">
            {activeCase.nickname}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {t('wizard.stepOf', { current: activeStep + 1, total: planStepsData.length })}
          </span>
        </div>
      </div>

      {/* Interactive Stepper */}
      <Stepper
        steps={stepperItems}
        activeStep={activeStep}
        completedSteps={completedSteps}
        onSelectStep={(idx) => setActiveStep(idx)}
      />

      {/* Step Detail Card */}
      {currentStepData && (
        <Card className="border-border shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <Badge
                variant={
                  currentStepData.urgency === 'immediate' || currentStepData.urgency === 'critical'
                    ? 'danger'
                    : 'warning'
                }
                size="sm"
              >
                {currentStepData.urgency.toUpperCase()}
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">
                Step {currentStepData.stepNumber} of 5
              </span>
            </div>
            <CardTitle className="text-xl font-bold pt-1">
              {currentStepData.title[language] || currentStepData.title.en}
            </CardTitle>
            <CardDescription className="text-sm pt-1 leading-relaxed">
              {currentStepData.summary[language] || currentStepData.summary.en}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step Action Points */}
            <div className="rounded-xl border border-border bg-surface/30 p-4 space-y-2.5">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Key Action Points:
              </h4>
              <ul className="space-y-2 text-sm text-foreground/90 pl-5 list-disc">
                {currentStepData.points.map((pt, pIdx) => (
                  <li key={pIdx}>{pt[language] || pt.en}</li>
                ))}
              </ul>
            </div>

            {/* Step 1 Specific Actions */}
            {activeStep === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href="tel:112"
                  className="flex items-center gap-3 rounded-xl border border-danger/40 bg-danger/10 p-4 text-danger hover:bg-danger/20 transition-all"
                >
                  <span className="text-2xl">🚨</span>
                  <div>
                    <h5 className="font-bold text-sm">Emergency 112</h5>
                    <p className="text-xs text-foreground/80">Immediate physical safety assistance</p>
                  </div>
                </a>

                <a
                  href="tel:1930"
                  className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4 text-primary hover:bg-primary/20 transition-all"
                >
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <h5 className="font-bold text-sm">Cybercrime Helpline 1930</h5>
                    <p className="text-xs text-foreground/80">National MHA reporting helpline</p>
                  </div>
                </a>
              </div>
            )}

            {/* Step 2 Specific Actions */}
            {activeStep === 1 && (
              <div className="space-y-3 pt-2">
                <Banner variant="info" title="Privacy-First Evidence Collection">
                  {t('evidence.warningBanner')}
                </Banner>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={onNavigateToEvidence}>
                    Go to Evidence Vault & File Hasher →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 Specific Actions: Takedown Notice Generator */}
            {activeStep === 2 && (
              <div className="space-y-4 pt-2">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Target Platform for Complaint:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {platformsData.map((plat) => {
                      const isSelected = plat.id === selectedPlatformId;
                      return (
                        <button
                          key={plat.id}
                          type="button"
                          onClick={() => setSelectedPlatformId(plat.id)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground font-semibold'
                              : 'border-border bg-surface text-foreground hover:bg-surface/80'
                          }`}
                        >
                          {plat.displayName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Platform link guidance */}
                {selectedPlatform && (
                  <div className="rounded-xl border border-border bg-surface/40 p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-primary">
                        How to find link on {selectedPlatform.displayName}:
                      </span>
                      <Badge variant="unverified" size="sm">
                        {t('common.unverified')}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground/90">
                      {selectedPlatform.howToFindLink[language] || selectedPlatform.howToFindLink.en}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedPlatform.grievanceOfficerNote[language] || selectedPlatform.grievanceOfficerNote.en}
                    </p>
                  </div>
                )}

                {/* Generated legal complaint */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      {t('wizard.generateNotice')}
                    </span>
                    <CopyButton
                      textToCopy={complaintNotice.body}
                      copyLabel={t('wizard.copyNotice')}
                      copiedLabel={t('wizard.noticeCopied')}
                    />
                  </div>

                  <div className="rounded-xl border border-border bg-black/40 p-4 font-mono text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto select-all">
                    {complaintNotice.body}
                  </div>
                </div>

                {/* Action button to record submission */}
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-semibold text-foreground">Submitted the notice?</h5>
                    <p className="text-xs text-muted-foreground">
                      Log your submission to start the statutory 24-hour compliance countdown.
                    </p>
                  </div>
                  <Button onClick={handleQuickLogNotice}>
                    Start 24-Hour Timer →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4 Specific Actions: 24h Countdown & Alerts */}
            {activeStep === 3 && (
              <div className="space-y-4 pt-2">
                {latestReport ? (
                  <div className="space-y-4">
                    <Countdown
                      submittedAt={latestReport.submittedAt}
                      dueAt={latestReport.dueAt}
                    />

                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => handleDownloadIcs(latestReport)}
                        leftIcon={<span>📅</span>}
                      >
                        {t('reports.downloadIcs')}
                      </Button>
                      <Button variant="outline" onClick={onNavigateToReports}>
                        Manage All Notices & Outcomes →
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-surface/30 p-6 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      No notice submission recorded for this case yet.
                    </p>
                    <Button variant="secondary" onClick={() => setActiveStep(2)}>
                      ← Go to Step 3 to Generate & Log Notice
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Step 5 Specific Actions: Escalation Ladder & Formal Filing */}
            {activeStep === 4 && (
              <div className="space-y-4 pt-2">
                <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
                  <h4 className="text-sm font-bold text-foreground">
                    Official Statutory Escalation Routes:
                  </h4>

                  <div className="space-y-3">
                    <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary">Stage 1: Grievance Appellate Committee (GAC)</span>
                        <Badge variant="unverified" size="sm">Check Eligibility</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        File an appeal if the intermediary failed to remove content in 24h or rejected your complaint.
                      </p>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400">Stage 2: National Cybercrime Portal (cybercrime.gov.in)</span>
                        <Badge variant="verified" size="sm">Official Portal</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Report under &apos;Crime Against Women &amp; Children&apos; with your reference ticket and exported case proof.
                      </p>
                      <a
                        href="https://cybercrime.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-xs text-primary underline mt-1"
                      >
                        Open cybercrime.gov.in ↗
                      </a>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400">Stage 3: Local Police FIR / Cyber Police Station</span>
                        <Badge variant="verified" size="sm">BNS &amp; IT Act</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Lodge formal First Information Report (FIR) under BNS and IT Act Sections 66E, 67, 67A.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={onNavigateToSummary} leftIcon={<span>📄</span>}>
                    View &amp; Print Case Summary for Police →
                  </Button>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="ghost"
              disabled={activeStep === 0}
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
            >
              ← {t('wizard.prevStep')}
            </Button>

            <div className="flex gap-2">
              <Button
                variant={completedSteps.includes(activeStep) ? 'secondary' : 'primary'}
                onClick={() => markStepDone(activeStep)}
              >
                {completedSteps.includes(activeStep)
                  ? t('wizard.completed')
                  : t('wizard.markCompleted')}
              </Button>

              {activeStep < planStepsData.length - 1 && (
                <Button
                  variant="outline"
                  onClick={() => setActiveStep((prev) => Math.min(planStepsData.length - 1, prev + 1))}
                >
                  {t('wizard.nextStep')} →
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};
