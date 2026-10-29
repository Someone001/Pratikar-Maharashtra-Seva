import React, { useState, useEffect } from 'react';
import { useI18n } from '../../lib/i18n';
import { useVault } from '../vault/VaultContext';
import {
  getReportsByCase,
  getEvidenceByCase,
  getLinksByCase,
  saveCase,
  saveLink,
  saveReport,
  saveEvidenceEntry,
} from '../../lib/storage';
import { verifyEvidenceChain } from '../../lib/hashchain';
import type { CaseRecord, EvidenceEntry, LinkRecord, ReportRecord } from '../../types';
import { Button, Card, Badge, Banner } from '../../components';

export interface PrintableSummaryProps {
  activeCase: CaseRecord | null;
}

export const PrintableSummary: React.FC<PrintableSummaryProps> = ({ activeCase }) => {
  const { t } = useI18n();
  const { activeKey } = useVault();

  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [evidence, setEvidence] = useState<EvidenceEntry[]>([]);
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [isChainValid, setIsChainValid] = useState<boolean>(true);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCase || !activeKey) return;
    getReportsByCase(activeCase.id, activeKey).then(setReports);
    getLinksByCase(activeCase.id, activeKey).then(setLinks);
    getEvidenceByCase(activeCase.id, activeKey).then(async (entries) => {
      setEvidence(entries);
      const res = await verifyEvidenceChain(entries);
      setIsChainValid(res.isValid);
    });
  }, [activeCase, activeKey]);

  if (!activeCase) {
    return (
      <Card variant="muted" className="p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Please select a case to generate its printable summary and law enforcement report.
        </p>
      </Card>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const exportBundle = {
      app: 'Pratikar',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      case: activeCase,
      links,
      reports,
      evidence,
      chainValid: isChainValid,
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pratikar-case-${activeCase.nickname.toLowerCase().replace(/\s+/g, '-')}-backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeKey) return;

    try {
      const text = await file.text();
      const bundle = JSON.parse(text);

      if (bundle.case && bundle.evidence) {
        await saveCase(bundle.case, activeKey);
        for (const l of bundle.links || []) {
          await saveLink(l, activeKey);
        }
        for (const r of bundle.reports || []) {
          await saveReport(r, activeKey);
        }
        for (const ev of bundle.evidence || []) {
          await saveEvidenceEntry(ev, activeKey);
        }
        setImportStatus('Backup successfully imported! Please reload or select the imported case.');
      } else {
        setImportStatus('Invalid backup file format.');
      }
    } catch (err) {
      console.error('Import failed:', err);
      setImportStatus('Failed to import backup file.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden in print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('documents.title')}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">{t('documents.subtitle')}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handlePrint} leftIcon={<span>🖨️</span>}>
            {t('documents.printBtn')}
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportJson}>
            {t('documents.downloadJson')}
          </Button>

          <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface/80 transition-colors">
            {t('documents.importJson')}
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJson}
            />
          </label>
        </div>
      </div>

      {importStatus && (
        <Banner variant="info" className="no-print">
          {importStatus}
        </Banner>
      )}

      {/* PRINTABLE DOCUMENT AREA */}
      <div className="printable-area rounded-xl border border-border bg-card p-6 sm:p-10 text-card-foreground shadow-md space-y-8">
        {/* Document Header */}
        <div className="border-b-2 border-primary/60 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-wider uppercase">
              <span>PRATIKAR (प्रतिकार)</span>
              <span>•</span>
              <span>EVIDENCE RECORD</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
              NCII Redress &amp; Evidence Summary
            </h1>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Statutory Reference: IT Rules, 2021 (Rule 3(2)(b)) &amp; MeitY SOP (11 Nov 2025)
            </p>
          </div>

          <div className="text-right font-mono text-xs text-muted-foreground">
            <div>Generated: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</div>
            <div className="mt-1">
              <Badge variant={isChainValid ? 'verified' : 'danger'} size="sm">
                {isChainValid ? 'SHA-256 Chain Intact' : 'Chain Integrity Warning'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="rounded-lg border border-border bg-surface/30 p-3.5 text-xs text-muted-foreground leading-relaxed">
          <span className="font-bold text-foreground">STATUTORY NOTICE &amp; DISCLAIMER: </span>
          {t('documents.disclaimer')}
        </div>

        {/* Section 1: Incident & Case Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
            1. Incident &amp; Complainant Summary
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="font-semibold text-muted-foreground">Case Nickname: </span>
              <span className="font-bold text-foreground">{activeCase.nickname}</span>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground">Reporting Mode: </span>
              <span>{activeCase.mode === 'self' ? 'Self-Reported by Victim' : `Assisted by Helper (${activeCase.helperName || 'Representative'})`}</span>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground">Initial Record Created: </span>
              <span>{new Date(activeCase.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground">Offender Relationship: </span>
              <span className="capitalize">{activeCase.offenderKnown}</span>
            </div>
          </div>

          <div className="text-xs space-y-1 pt-1">
            <span className="font-semibold text-muted-foreground">Nature of Violation: </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {activeCase.situation.map((s) => (
                <span key={s} className="rounded bg-surface px-2 py-0.5 text-[11px] font-medium border border-border">
                  #{s}
                </span>
              ))}
            </div>
          </div>

          {activeCase.identifiers && activeCase.identifiers.length > 0 && (
            <div className="text-xs pt-1">
              <span className="font-semibold text-muted-foreground">Offender Identifiers / Handles: </span>
              <span className="font-mono">{activeCase.identifiers.join(', ')}</span>
            </div>
          )}

          {activeCase.personalDetails?.name && (
            <div className="text-xs pt-1">
              <span className="font-semibold text-muted-foreground">Complainant Contact: </span>
              <span>
                {activeCase.personalDetails.name} • {activeCase.personalDetails.phone || 'Phone not provided'} • {activeCase.personalDetails.email || 'Email not provided'}
              </span>
            </div>
          )}
        </div>

        {/* Section 2: Statutory Notices & Platform 24h Responses */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
            2. Platform 24-Hour Statutory Notices Log (Rule 3(2)(b))
          </h3>

          {reports.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No formal platform notices logged for this case.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface/50">
                    <th className="p-2 font-semibold">Platform</th>
                    <th className="p-2 font-semibold">Channel</th>
                    <th className="p-2 font-semibold">Notice Submitted (IST)</th>
                    <th className="p-2 font-semibold">24h Deadline (IST)</th>
                    <th className="p-2 font-semibold">Reference ID</th>
                    <th className="p-2 font-semibold">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-b border-border/40">
                      <td className="p-2 font-bold capitalize">{r.platform}</td>
                      <td className="p-2">{r.channel}</td>
                      <td className="p-2 font-mono">
                        {new Date(r.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </td>
                      <td className="p-2 font-mono">
                        {new Date(r.dueAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </td>
                      <td className="p-2 font-mono">{r.referenceNumber || 'N/A'}</td>
                      <td className="p-2">
                        <Badge variant={r.outcome === 'removed' ? 'verified' : 'neutral'} size="sm">
                          {r.outcome.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 3: Evidence Log & Tamper-Evident SHA-256 Hash Chain */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
            3. Chronological Evidence Ledger &amp; Cryptographic SHA-256 Chain
          </h3>

          {evidence.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No evidence entries recorded.</p>
          ) : (
            <div className="space-y-2">
              {evidence.map((ev) => (
                <div key={ev.id} className="rounded-lg border border-border p-3 text-xs space-y-1.5 font-mono">
                  <div className="flex items-center justify-between border-b border-border/40 pb-1">
                    <span className="font-bold text-primary">#{ev.seq} • {ev.type.toUpperCase()}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(ev.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
                    </span>
                  </div>
                  <div className="font-sans text-xs text-foreground/90">
                    {Object.entries(ev.fields).map(([k, v]) => (
                      <div key={k} className="flex gap-1">
                        <span className="font-semibold text-muted-foreground capitalize">{k}:</span>
                        <span className="break-all">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-1 text-[10px] text-muted-foreground flex flex-col sm:flex-row gap-2">
                    <span className="truncate">prev: {ev.prevHash}</span>
                    <span className="truncate text-emerald-400">hash: {ev.hash}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sign-off footer */}
        <div className="border-t-2 border-border/60 pt-6 flex flex-col sm:flex-row justify-between text-xs text-muted-foreground gap-4">
          <div>
            <p className="font-semibold text-foreground">Verification Statement:</p>
            <p>Cryptographic hash chain validated on client device via Web Crypto API.</p>
          </div>
          <div className="text-right">
            <p>Officer Signature / Case Diary Ref:</p>
            <div className="mt-6 border-b border-muted-foreground/60 w-48 inline-block" />
          </div>
        </div>
      </div>
    </div>
  );
};
