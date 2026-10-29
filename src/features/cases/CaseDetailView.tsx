import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useVault } from '../vault/VaultContext';
import {
  getLinksByCase,
  getReportsByCase,
  getEvidenceByCase,
  saveReport,
} from '../../lib/storage';
import { verifyChain, appendEvidenceEntry } from '../../lib/hashchain';
import { hashFileInBrowser } from '../../lib/filehash';
import { generate24HourIcsFile, downloadIcsFile } from '../../lib/ics';
import {
  generate24HourComplaint,
  generateGrievanceFollowUp,
  generateNcrpPrepSheet,
  generatePoliceComplaintSummary,
  generateEvidencePreservationSummary,
} from '../../lib/templates';
import type { CaseRecord, LinkRecord, ReportRecord, EvidenceEntry, ReportOutcome } from '../../types';
import platformsData from '../../data/platforms.json';
import planStepsData from '../../data/plan-steps.json';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Field,
  TextArea,
  Select,
  Checkbox,
  Tabs,
  Badge,
  Banner,
  Countdown,
  CopyButton,
  Dialog,
  SafeExternalLink,
} from '../../components';

export interface CaseDetailViewProps {
  caseRecord: CaseRecord;
  onBack: () => void;
}

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({ caseRecord, onBack }) => {
  const { language } = useI18n();
  const { activeKey } = useVault();

  const [activeTab, setActiveTab] = useState<string>('plan');

  // Loaded Case Data
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [evidence, setEvidence] = useState<EvidenceEntry[]>([]);
  const [chainValid, setChainValid] = useState<boolean>(true);
  const [completedPlanSteps, setCompletedPlanSteps] = useState<number[]>([]);

  // Modals & Forms
  const [isNewReportModalOpen, setIsNewReportModalOpen] = useState(false);
  const [newReportPlatform, setNewReportPlatform] = useState(caseRecord.platforms[0] || 'Instagram');
  const [newReportRefNumber, setNewReportRefNumber] = useState('');
  const [newReportSubmittedAt, setNewReportSubmittedAt] = useState(new Date().toISOString().slice(0, 16));

  const [isAddEvidenceModalOpen, setIsAddEvidenceModalOpen] = useState(false);
  const [evidenceType, setEvidenceType] = useState<EvidenceEntry['type']>('note');
  const [evidenceText, setEvidenceText] = useState('');
  const [evidenceSender, setEvidenceSender] = useState('');

  // File Hasher
  const [isHashingFile, setIsHashingFile] = useState(false);
  const [hashedFileInfo, setHashedFileInfo] = useState<{
    fileName: string;
    fileSize: number;
    fileType: string;
    sha256: string;
  } | null>(null);

  // Document redaction toggle
  const [redactPersonalDetails, setRedactPersonalDetails] = useState(false);
  const [complaintLanguage, setComplaintLanguage] = useState<'en' | 'hi' | 'mr'>('en');

  // Outcome confirmation state
  const [outcomeConfirmReportId, setOutcomeConfirmReportId] = useState<string | null>(null);
  const [removalVerifiedChecked, setRemovalVerifiedChecked] = useState(false);

  const loadCaseData = useCallback(async () => {
    if (!activeKey) return;
    try {
      const [l, r, e, verification] = await Promise.all([
        getLinksByCase(caseRecord.id, activeKey),
        getReportsByCase(caseRecord.id, activeKey),
        getEvidenceByCase(caseRecord.id, activeKey),
        verifyChain(caseRecord.id, activeKey),
      ]);
      setLinks(l);
      setReports(r);
      setEvidence(e);
      setChainValid(verification.isValid);
    } catch (err) {
      console.error('Failed to load case data:', err);
    }
  }, [caseRecord.id, activeKey]);

  useEffect(() => {
    loadCaseData();
  }, [loadCaseData]);

  const togglePlanStep = (stepIdx: number) => {
    setCompletedPlanSteps((prev) =>
      prev.includes(stepIdx) ? prev.filter((s) => s !== stepIdx) : [...prev, stepIdx],
    );
  };

  // Submit New Report
  const handleSaveReport = async () => {
    if (!activeKey) return;
    const submittedDate = new Date(newReportSubmittedAt);
    const dueDate = new Date(submittedDate.getTime() + 24 * 60 * 60 * 1000);

    const newRep: ReportRecord = {
      id: crypto.randomUUID(),
      caseId: caseRecord.id,
      platform: newReportPlatform,
      channel: 'platform',
      submittedAt: submittedDate.toISOString(),
      dueAt: dueDate.toISOString(),
      referenceNumber: newReportRefNumber.trim() || undefined,
      linkIds: links.map((l) => l.id),
      outcome: 'pending',
    };

    await saveReport(newRep, activeKey);
    await appendEvidenceEntry(
      caseRecord.id,
      'report_submitted',
      {
        platform: newReportPlatform,
        referenceNumber: newRep.referenceNumber,
        submittedAt: newRep.submittedAt,
        dueAt: newRep.dueAt,
      },
      activeKey,
    );

    setIsNewReportModalOpen(false);
    setNewReportRefNumber('');
    await loadCaseData();
  };

  // Update Report Outcome
  const handleSetOutcome = async (reportId: string, outcome: ReportOutcome) => {
    if (!activeKey) return;
    const rep = reports.find((r) => r.id === reportId);
    if (!rep) return;

    if (outcome === 'removed') {
      // Require user verification
      setOutcomeConfirmReportId(reportId);
      return;
    }

    const updated: ReportRecord = {
      ...rep,
      outcome,
      outcomeAt: new Date().toISOString(),
    };

    await saveReport(updated, activeKey);
    await appendEvidenceEntry(
      caseRecord.id,
      'outcome',
      {
        reportId,
        platform: rep.platform,
        outcome,
        outcomeAt: updated.outcomeAt,
      },
      activeKey,
    );

    await loadCaseData();
  };

  const handleConfirmRemovalOutcome = async () => {
    if (!activeKey || !outcomeConfirmReportId || !removalVerifiedChecked) return;
    const rep = reports.find((r) => r.id === outcomeConfirmReportId);
    if (!rep) return;

    const updated: ReportRecord = {
      ...rep,
      outcome: 'removed',
      outcomeAt: new Date().toISOString(),
    };

    await saveReport(updated, activeKey);
    await appendEvidenceEntry(
      caseRecord.id,
      'outcome',
      {
        reportId: rep.id,
        platform: rep.platform,
        outcome: 'removed',
        userVerificationNote: 'User confirmed: I checked and the content is no longer visible online.',
        outcomeAt: updated.outcomeAt,
      },
      activeKey,
    );

    setOutcomeConfirmReportId(null);
    setRemovalVerifiedChecked(false);
    await loadCaseData();
  };

  // Add Evidence Entry
  const handleSaveEvidence = async () => {
    if (!activeKey) return;
    const fields: Record<string, unknown> = {};

    if (evidenceType === 'note') {
      fields.note = evidenceText.trim();
    } else if (evidenceType === 'threat_received') {
      fields.sender = evidenceSender.trim();
      fields.messageText = evidenceText.trim();
      fields.receivedAt = new Date().toISOString();
    } else if (evidenceType === 'platform_reply') {
      fields.replyText = evidenceText.trim();
      fields.receivedAt = new Date().toISOString();
    } else if (evidenceType === 'file_hash' && hashedFileInfo) {
      fields.fileName = hashedFileInfo.fileName;
      fields.fileSize = hashedFileInfo.fileSize;
      fields.fileType = hashedFileInfo.fileType;
      fields.sha256 = hashedFileInfo.sha256;
      fields.notes = evidenceText.trim();
    }

    await appendEvidenceEntry(caseRecord.id, evidenceType, fields, activeKey);
    setIsAddEvidenceModalOpen(false);
    setEvidenceText('');
    setEvidenceSender('');
    setHashedFileInfo(null);
    await loadCaseData();
  };

  // File Hasher Tool
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 100 MB Limit (Section 8.9)
    if (file.size > 100 * 1024 * 1024) {
      alert('File size exceeds 100 MB limit. Please select a smaller screenshot file.');
      return;
    }

    setIsHashingFile(true);
    try {
      const res = await hashFileInBrowser(file);
      setHashedFileInfo({
        fileName: res.fileName,
        fileSize: res.fileSize,
        fileType: res.fileType,
        sha256: res.sha256,
      });
    } catch (err) {
      console.error('File hashing failed:', err);
    } finally {
      setIsHashingFile(false);
    }
  };

  const handleDownloadIcs = (rep: ReportRecord) => {
    const ics = generate24HourIcsFile({
      platformName: rep.platform,
      submittedAt: rep.submittedAt,
      referenceNumber: rep.referenceNumber,
    });
    downloadIcsFile(`takedown-reminder-${rep.platform}.ics`, ics);
  };

  // Render merged chronological timeline for Law Enforcement
  const timelineEvents = [
    ...reports.map((r) => ({
      date: r.submittedAt,
      type: 'Takedown Notice Submitted',
      detail: `Platform: ${r.platform} | Ticket: ${r.referenceNumber || 'None'} | Outcome: ${r.outcome}`,
      badge: 'notice',
    })),
    ...evidence.map((e) => ({
      date: e.createdAt,
      type: `Evidence Entry #${e.seq} (${e.type})`,
      detail: JSON.stringify(e.fields),
      badge: 'evidence',
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Current Generated Templates
  const complaintTemplate = generate24HourComplaint({
    caseRecord,
    platformName: caseRecord.platforms[0] || 'Platform',
    links,
    language: complaintLanguage,
    anonymous: redactPersonalDetails,
  });

  const followUpTemplate = reports[0]
    ? generateGrievanceFollowUp({ caseRecord, report: reports[0], language: complaintLanguage })
    : null;

  const ncrpSheet = generateNcrpPrepSheet({
    caseRecord,
    links,
    reports,
    language,
  });

  const policeSummary = generatePoliceComplaintSummary({
    caseRecord,
    links,
    reports,
    evidence,
    redactPersonalDetails,
  });

  const evidenceSummary = generateEvidencePreservationSummary({
    caseRecord,
    evidence,
    chainValid,
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 mb-1"
          >
            ← Back to All Cases
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              {caseRecord.nickname}
            </h1>
            <Badge
              variant={caseRecord.status === 'active' ? 'info' : 'success'}
              size="sm"
            >
              {caseRecord.status}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={chainValid ? 'success' : 'danger'} size="sm">
            {chainValid ? '✓ SHA-256 Chain Intact' : '⚠️ Hash Chain Alert'}
          </Badge>
          <Button size="sm" onClick={() => setIsNewReportModalOpen(true)}>
            + Log Notice
          </Button>
        </div>
      </div>

      {/* 5 Tabs (Section 8.6) */}
      <Tabs
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId)}
        tabs={[
          { id: 'plan', label: '1. Redress Plan' },
          { id: 'reports', label: `2. Reports (${reports.length})` },
          { id: 'evidence', label: `3. Evidence Ledger (${evidence.length})` },
          { id: 'documents', label: '4. Legal Documents' },
          { id: 'timeline', label: '5. Police Timeline' },
        ]}
      />

      {/* TAB 1: Action Plan (a - h) */}
      {activeTab === 'plan' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground">Personalized Redress Checklist</h3>
              <p className="text-xs text-muted-foreground pt-0.5">
                Statutory guidance based on Rule 3(2)(b) of IT Rules, 2021 & MeitY SOP (11 Nov 2025).
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-primary">
              {completedPlanSteps.length} of {planStepsData.length} Completed
            </span>
          </div>

          <div className="space-y-3">
            {planStepsData.map((step, idx) => {
              const isDone = completedPlanSteps.includes(idx);
              return (
                <Card
                  key={step.id}
                  className={`border transition-all ${
                    isDone ? 'border-border/60 bg-surface/30 opacity-80' : 'border-border bg-card'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => togglePlanStep(idx)}
                          className="mt-1 h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
                        />
                        <div>
                          <CardTitle className={`text-base font-bold ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                            Step {step.stepNumber}: {step.title[language] || step.title.en}
                          </CardTitle>
                          <CardDescription className="text-xs pt-1">
                            {step.summary[language] || step.summary.en}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={step.urgency === 'immediate' ? 'danger' : step.urgency === 'critical' ? 'warning' : 'default'}
                        size="sm"
                      >
                        {step.urgency}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2 text-xs text-foreground/80 space-y-1.5 pl-10">
                    {step.points.map((pt, pIdx) => (
                      <p key={pIdx}>• {pt[language] || pt.en}</p>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Reports & 24h Countdown & Escalation Ladder */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-foreground">24-Hour Statutory Notices</h3>
              <p className="text-xs text-muted-foreground">
                Track compliance deadlines under Rule 3(2)(b) of the IT Rules 2021.
              </p>
            </div>
            <Button size="sm" onClick={() => setIsNewReportModalOpen(true)}>
              + Log New Notice
            </Button>
          </div>

          {reports.length === 0 ? (
            <Card variant="muted" className="p-8 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                No takedown notice has been logged for this case yet.
              </p>
              <Button size="sm" onClick={() => setIsNewReportModalOpen(true)}>
                Log Your First Notice Submission
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((rep) => {
                const diffMs = new Date(rep.dueAt).getTime() - Date.now();
                const isOverdue = diffMs <= 0;
                const hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
                const minutesRemaining = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                return (
                  <Card key={rep.id} className="border-border shadow-sm space-y-4 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-foreground">{rep.platform}</h4>
                          <span className="text-xs text-muted-foreground">
                            Ticket: <strong>{rep.referenceNumber || 'Pending'}</strong>
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground pt-0.5">
                          Submitted at: {new Date(rep.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                        </p>
                      </div>

                      {/* Status Chip (Section 8.8) */}
                      <div>
                        {rep.outcome === 'removed' ? (
                          <Badge variant="success">✓ Content Removed</Badge>
                        ) : isOverdue ? (
                          <Badge variant="warning">
                            Deadline passed {Math.abs(hoursRemaining)}h {Math.abs(minutesRemaining)}m ago
                          </Badge>
                        ) : hoursRemaining < 6 ? (
                          <Badge variant="warning">
                            {hoursRemaining}h {minutesRemaining}m remaining (Under 6h)
                          </Badge>
                        ) : (
                          <Badge variant="info">
                            On Track ({hoursRemaining}h {minutesRemaining}m remaining)
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Live Countdown if pending */}
                    {rep.outcome === 'pending' && !isOverdue && (
                      <Countdown
                        deadline={rep.dueAt}
                        label="Statutory 24-Hour Removal Deadline"
                      />
                    )}

                    {/* Escalation Ladder if Overdue / Rejected (Section 8.8) */}
                    {(isOverdue || rep.outcome === 'rejected' || rep.outcome === 'noResponse') && rep.outcome !== 'removed' && (
                      <div className="rounded-xl border border-warning/50 bg-warning-surface/30 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-warning font-bold text-sm">
                          <span>⚠️</span> Statutory Escalation Ladder (Missed 24-Hour Rule)
                        </div>
                        <p className="text-xs text-foreground/90 leading-relaxed">
                          The intermediary has failed to disable access within the statutory 24-hour mandate. Follow these escalation channels:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setActiveTab('documents');
                            }}
                          >
                            1. Send Grievance Follow-Up Notice →
                          </Button>

                          <SafeExternalLink
                            href="https://gac.gov.in"
                            className="flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface/80"
                          >
                            2. File Grievance Appellate (GAC) ↗
                          </SafeExternalLink>

                          <a
                            href="tel:1930"
                            className="flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-primary hover:bg-surface/80"
                          >
                            3. Call Cybercrime Helpline 1930
                          </a>

                          <SafeExternalLink
                            href="https://cybercrime.gov.in"
                            className="flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-accent hover:bg-surface/80"
                          >
                            4. Lodge FIR on cybercrime.gov.in ↗
                          </SafeExternalLink>
                        </div>
                      </div>
                    )}

                    {/* Outcome Actions & Reminders */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-border/40">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-semibold">Update Outcome:</span>
                        {(['pending', 'acknowledged', 'removed', 'partial', 'rejected', 'noResponse'] as ReportOutcome[]).map((oc) => (
                          <button
                            key={oc}
                            type="button"
                            onClick={() => handleSetOutcome(rep.id, oc)}
                            className={`rounded px-2 py-1 transition-colors text-xs ${
                              rep.outcome === oc
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'bg-surface text-muted-foreground hover:text-foreground border border-border'
                            }`}
                          >
                            {oc}
                          </button>
                        ))}
                      </div>

                      <Button variant="ghost" size="sm" onClick={() => handleDownloadIcs(rep)}>
                        📅 Download .ICS Reminder
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Evidence Vault & 100MB File Hasher */}
      {activeTab === 'evidence' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-foreground">Tamper-Evident Evidence Vault</h3>
              <p className="text-xs text-muted-foreground">
                Cryptographic SHA-256 hash chain stored purely on your device.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setIsAddEvidenceModalOpen(true)}>
                + Add Evidence Record
              </Button>
            </div>
          </div>

          <Banner variant="info" title="Absolute Zero Image Storage Policy">
            Pratikar strictly refuses to store, process, or transmit intimate images. Only cryptographic hashes, URLs, dates, and textual descriptions are preserved.
          </Banner>

          {/* Evidence Entries Table */}
          <div className="space-y-3">
            {evidence.map((entry) => (
              <Card key={entry.id} className="border-border p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" size="sm">
                      Seq #{entry.seq}
                    </Badge>
                    <span className="font-bold text-foreground capitalize">
                      {entry.type.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-muted-foreground font-mono">
                    {new Date(entry.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                  </span>
                </div>

                <div className="space-y-1 font-mono text-[11px] text-foreground/90">
                  <pre className="whitespace-pre-wrap font-sans bg-surface/50 p-2 rounded border border-border/60">
                    {JSON.stringify(entry.fields, null, 2)}
                  </pre>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>SHA-256: <code className="text-primary font-mono">{entry.hash.substring(0, 24)}...</code></span>
                  <span>Prev: <code className="text-muted-foreground font-mono">{entry.prevHash.substring(0, 16)}...</code></span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Legal Documents Generator */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
            <div>
              <h3 className="font-bold text-base text-foreground">Deterministic Legal Notices & Prep Sheets</h3>
              <p className="text-xs text-muted-foreground">
                Statutory complaints prefilled from your encrypted case records.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-surface">
                {(['en', 'hi', 'mr'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setComplaintLanguage(l)}
                    className={`px-2 py-0.5 text-xs rounded font-medium ${
                      complaintLanguage === l ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>

              <Checkbox
                label="Redact Personal Details"
                checked={redactPersonalDetails}
                onChange={(e) => setRedactPersonalDetails(e.target.checked)}
              />

              <Button size="sm" onClick={() => window.print()}>
                🖨️ Print / Save as PDF
              </Button>
            </div>
          </div>

          {/* 1. Platform Takedown Notice */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">
                  1. Platform 24-Hour Statutory Takedown Complaint
                </CardTitle>
                <CopyButton text={`${complaintTemplate.subject}\n\n${complaintTemplate.body}`} label="Copy Complaint" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border bg-black/40 p-4 font-mono text-xs text-foreground/90 whitespace-pre-wrap max-h-64 overflow-y-auto">
                <div className="font-bold text-primary mb-2">Subject: {complaintTemplate.subject}</div>
                {complaintTemplate.body}
              </div>
            </CardContent>
          </Card>

          {/* 2. Missed Deadline Follow-Up */}
          {followUpTemplate && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">
                    2. Grievance Officer Missed-Deadline Escalation Notice
                  </CardTitle>
                  <CopyButton text={`${followUpTemplate.subject}\n\n${followUpTemplate.body}`} label="Copy Follow-Up" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border bg-black/40 p-4 font-mono text-xs text-foreground/90 whitespace-pre-wrap max-h-56 overflow-y-auto">
                  <div className="font-bold text-warning mb-2">Subject: {followUpTemplate.subject}</div>
                  {followUpTemplate.body}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3. NCRP 1930 Prep Sheet */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">
                  3. National Cybercrime Portal (NCRP) / 1930 Call Prep Sheet
                </CardTitle>
                <CopyButton text={ncrpSheet.readOutSummary} label="Copy Summary Text" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1 text-xs text-foreground/80 pl-2">
                <span className="font-semibold text-muted-foreground uppercase text-[11px] block">
                  Have these items ready before dialing 1930:
                </span>
                {ncrpSheet.checklist.map((c, i) => (
                  <p key={i}>✓ {c}</p>
                ))}
              </div>
              <div className="rounded-xl border border-border bg-black/40 p-4 font-mono text-xs text-foreground/90 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {ncrpSheet.readOutSummary}
              </div>
            </CardContent>
          </Card>

          {/* 4. Police Complaint Summary */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">
                  4. Police / Cyber Cell Formal Complaint Summary
                </CardTitle>
                <CopyButton text={policeSummary} label="Copy Police Summary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border bg-black/40 p-4 font-mono text-xs text-foreground/90 whitespace-pre-wrap max-h-64 overflow-y-auto">
                {policeSummary}
              </div>
            </CardContent>
          </Card>

          {/* 5. Evidence Preservation Summary & Draft Statement */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">
                  5. Evidence Preservation Record & Legal Counsel Statement
                </CardTitle>
                <CopyButton text={evidenceSummary} label="Copy Preservation Record" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border bg-black/40 p-4 font-mono text-xs text-foreground/90 whitespace-pre-wrap max-h-56 overflow-y-auto">
                {evidenceSummary}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: Police Chronological Timeline (Section 8.6) */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="border-b border-border/40 pb-2">
            <h3 className="font-bold text-base text-foreground">
              Merged Chronological Incident Timeline
            </h3>
            <p className="text-xs text-muted-foreground">
              Combined statutory sequence of notices, threat receipts, platform outcomes, and evidence entries.
            </p>
          </div>

          <div className="space-y-3">
            {timelineEvents.map((evt, idx) => (
              <div key={idx} className="flex gap-3 text-xs">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  {idx < timelineEvents.length - 1 && <div className="h-full w-0.5 bg-border mt-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{evt.type}</span>
                    <span className="font-mono text-muted-foreground text-[11px]">
                      {new Date(evt.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                    </span>
                  </div>
                  <p className="text-muted-foreground pt-1 font-mono text-[11px] break-all">
                    {evt.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Log New Report Submission */}
      <Dialog
        isOpen={isNewReportModalOpen}
        onClose={() => setIsNewReportModalOpen(false)}
        title="Log 24-Hour Notice Submission"
        description="Records submission time and starts the statutory compliance timer."
      >
        <div className="space-y-4">
          <Select
            label="Platform / Intermediary"
            value={newReportPlatform}
            onChange={(e) => setNewReportPlatform(e.target.value)}
            options={platformsData.map((p) => ({ value: p.displayName, label: p.displayName }))}
          />
          <Field
            label="Submission Date & Time (IST)"
            type="datetime-local"
            value={newReportSubmittedAt}
            onChange={(e) => setNewReportSubmittedAt(e.target.value)}
          />
          <Field
            label="Ticket / Reference Number (Optional)"
            value={newReportRefNumber}
            onChange={(e) => setNewReportRefNumber(e.target.value)}
            placeholder="e.g., IG-98765432"
            hint="Enter the reference ID sent in the platform's automated acknowledgement email."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsNewReportModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveReport}>
              Start 24-Hour Timer →
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal: Add Evidence Entry & File Hasher */}
      <Dialog
        isOpen={isAddEvidenceModalOpen}
        onClose={() => setIsAddEvidenceModalOpen(false)}
        title="Append Cryptographic Evidence Entry"
        description="Append-only record chained using SHA-256."
      >
        <div className="space-y-4">
          <Select
            label="Record Type"
            value={evidenceType}
            onChange={(e) => setEvidenceType(e.target.value as EvidenceEntry['type'])}
            options={[
              { value: 'note', label: 'Factual Case Note' },
              { value: 'threat_received', label: 'Threat or Extortion Message Received' },
              { value: 'platform_reply', label: 'Intermediary / Platform Communication' },
              { value: 'file_hash', label: 'Hash a File (Digital Fingerprint)' },
            ]}
          />

          {evidenceType === 'threat_received' && (
            <Field
              label="Sender Handle / Identifier"
              value={evidenceSender}
              onChange={(e) => setEvidenceSender(e.target.value)}
              placeholder="e.g., @blackmailer_handle"
            />
          )}

          {evidenceType === 'file_hash' && (
            <div className="space-y-3 rounded-xl border border-border p-3.5 bg-surface/40">
              <Banner variant="warning" title="Crucial Warning: Do NOT select intimate images">
                Only select screenshots of chat threats or profiles. The file is read in memory, hashed, and immediately discarded.
              </Banner>
              <input
                type="file"
                onChange={handleFileSelected}
                className="text-xs text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              {isHashingFile && <p className="text-xs text-primary animate-pulse">Calculating SHA-256 hash in client memory...</p>}
              {hashedFileInfo && (
                <div className="text-xs space-y-1 font-mono pt-1 text-foreground">
                  <div>File: {hashedFileInfo.fileName} ({Math.round(hashedFileInfo.fileSize / 1024)} KB)</div>
                  <div className="text-primary break-all">SHA-256: {hashedFileInfo.sha256}</div>
                </div>
              )}
            </div>
          )}

          <TextArea
            label={evidenceType === 'file_hash' ? 'Additional Notes on File' : 'Factual Description'}
            value={evidenceText}
            onChange={(e) => setEvidenceText(e.target.value)}
            rows={3}
            placeholder="Record factual observations without subjective conclusions..."
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAddEvidenceModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEvidence}>
              Append to Immutable Ledger ✓
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal: Confirm Removal Outcome Verification (Section 8.8) */}
      <Dialog
        isOpen={outcomeConfirmReportId !== null}
        onClose={() => setOutcomeConfirmReportId(null)}
        title="Verify Content Removal"
        description="Statutory confirmation required before marking removal."
      >
        <div className="space-y-4">
          <Banner variant="info" title="Verification Standard">
            To ensure legal accuracy when escalating or closing reports, you must personally verify that the reported URL or profile has been taken down.
          </Banner>

          <Checkbox
            label="I checked and it is no longer visible online."
            checked={removalVerifiedChecked}
            onChange={(e) => setRemovalVerifiedChecked(e.target.checked)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOutcomeConfirmReportId(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!removalVerifiedChecked}
              onClick={handleConfirmRemovalOutcome}
            >
              Confirm Removal Verified ✓
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
