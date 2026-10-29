import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useVault } from '../vault/VaultContext';
import { getEvidenceByCase, saveEvidenceEntry } from '../../lib/storage';
import { createEvidenceEntry, verifyEvidenceChain } from '../../lib/hashchain';
import { hashFileLocally, type FileHashResult } from '../../lib/filehash';
import type { CaseRecord, EvidenceEntry, EvidenceType } from '../../types';
import {
  Button,
  Card,
  CardHeader,
  Field,
  TextArea,
  Select,
  Dialog,
  Badge,
  Banner,
} from '../../components';

export interface EvidenceLedgerViewProps {
  activeCase: CaseRecord | null;
}

export const EvidenceLedgerView: React.FC<EvidenceLedgerViewProps> = ({ activeCase }) => {
  const { t } = useI18n();
  const { activeKey } = useVault();

  const [entries, setEntries] = useState<EvidenceEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    error?: string;
  } | null>(null);

  // New Record Form State
  const [entryType, setEntryType] = useState<EvidenceType>('note');
  const [narrativeText, setNarrativeText] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [senderHandle, setSenderHandle] = useState('');
  const [demandText, setDemandText] = useState('');

  // File Hasher State
  const [selectedFileResult, setSelectedFileResult] = useState<FileHashResult | null>(null);
  const [isHashingFile, setIsHashingFile] = useState(false);

  const loadEvidence = useCallback(async () => {
    if (!activeCase || !activeKey) return;
    try {
      const loaded = await getEvidenceByCase(activeCase.id, activeKey);
      setEntries(loaded);
      // Auto-verify chain
      const res = await verifyEvidenceChain(loaded);
      setVerificationResult(res);
    } catch (err) {
      console.error('Failed to load evidence chain:', err);
    }
  }, [activeCase, activeKey]);

  useEffect(() => {
    loadEvidence();
  }, [loadEvidence]);

  if (!activeCase) {
    return (
      <Card variant="muted" className="p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Please select or create an incident case first to view the tamper-evident evidence ledger.
        </p>
      </Card>
    );
  }

  const handleManualVerify = async () => {
    const res = await verifyEvidenceChain(entries);
    setVerificationResult(res);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeKey) return;

    let fields: Record<string, unknown> = {};
    if (entryType === 'note') {
      fields = { text: narrativeText.trim() };
    } else if (entryType === 'link_seen') {
      fields = { url: webUrl.trim(), notes: narrativeText.trim() || undefined };
    } else if (entryType === 'threat_received') {
      fields = {
        sender: senderHandle.trim(),
        demand: demandText.trim(),
        notes: narrativeText.trim() || undefined,
      };
    } else {
      fields = {
        details: narrativeText.trim(),
        target: senderHandle.trim() || undefined,
      };
    }

    const newEntry = await createEvidenceEntry({
      caseId: activeCase.id,
      type: entryType,
      fields,
      previousEntries: entries,
    });

    await saveEvidenceEntry(newEntry, activeKey);
    setIsModalOpen(false);
    setNarrativeText('');
    setWebUrl('');
    setSenderHandle('');
    setDemandText('');
    await loadEvidence();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsHashingFile(true);
    try {
      const result = await hashFileLocally(file);
      setSelectedFileResult(result);
    } catch (err) {
      console.error('File hashing failed:', err);
    } finally {
      setIsHashingFile(false);
      // Reset input value so same file can be selected again
      e.target.value = '';
    }
  };

  const handleAddFileHashToChain = async () => {
    if (!selectedFileResult || !activeKey) return;

    const fields: Record<string, unknown> = {
      fileName: selectedFileResult.fileName,
      fileSize: selectedFileResult.fileSize,
      fileType: selectedFileResult.fileType,
      lastModified: selectedFileResult.lastModified,
      sha256: selectedFileResult.sha256,
      note: 'Cryptographic SHA-256 fingerprint of screenshot/proof calculated in client memory',
    };

    const newEntry = await createEvidenceEntry({
      caseId: activeCase.id,
      type: 'file_hash',
      fields,
      previousEntries: entries,
    });

    await saveEvidenceEntry(newEntry, activeKey);
    setIsFileModalOpen(false);
    setSelectedFileResult(null);
    await loadEvidence();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('evidence.title')}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">{t('evidence.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsFileModalOpen(true)}>
            Compute File Hash Locally
          </Button>
          <Button size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<span>+</span>}>
            {t('evidence.addEntryBtn')}
          </Button>
        </div>
      </div>

      {/* Strict Privacy Banner */}
      <Banner variant="danger" title="Absolute Zero Image Storage Policy">
        {t('evidence.warningBanner')}
      </Banner>

      {/* Chain Integrity Status Card */}
      <Card
        className={`border ${
          verificationResult?.isValid
            ? 'border-emerald-600/50 bg-emerald-950/20'
            : 'border-danger bg-danger/20'
        }`}
      >
        <CardHeader className="py-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {verificationResult?.isValid ? '🛡️' : '⚠️'}
              </span>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  {verificationResult?.isValid
                    ? t('evidence.ledgerValid')
                    : t('evidence.ledgerTampered', { seq: 0 })}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {entries.length} chained entries recorded chronologically with SHA-256 links.
                </p>
                {verificationResult?.error && (
                  <p className="text-xs font-mono text-danger mt-1">
                    {verificationResult.error}
                  </p>
                )}
              </div>
            </div>

            <Button size="sm" variant="outline" onClick={handleManualVerify}>
              {t('evidence.verifyLedgerBtn')}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline Entries */}
      {entries.length === 0 ? (
        <Card variant="muted" className="p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">{t('evidence.noEntries')}</p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => setIsModalOpen(true)}>{t('evidence.addEntryBtn')}</Button>
            <Button variant="outline" onClick={() => setIsFileModalOpen(true)}>
              Hash a File
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80 shadow-sm space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/30 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-xs font-mono font-bold text-primary">
                    #{entry.seq}
                  </span>
                  <Badge variant="info" size="sm">
                    {entry.type.toUpperCase().replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
                  </span>
                </div>
              </div>

              {/* Entry Fields */}
              <div className="text-xs space-y-1.5 font-sans">
                {Object.entries(entry.fields).map(([k, v]) => (
                  <div key={k} className="flex flex-col sm:flex-row sm:items-start gap-1">
                    <span className="font-semibold text-muted-foreground capitalize min-w-[90px]">
                      {k}:
                    </span>
                    <span className="text-foreground/90 font-mono break-all">{String(v)}</span>
                  </div>
                ))}
              </div>

              {/* Cryptographic Hash linkage */}
              <div className="pt-2 border-t border-border/30 flex flex-col sm:flex-row gap-2 text-[10px] font-mono text-muted-foreground">
                <div className="flex-1 truncate">
                  <span className="text-muted-foreground/60">prevHash: </span>
                  <span className="text-muted-foreground">{entry.prevHash}</span>
                </div>
                <div className="flex-1 truncate">
                  <span className="text-emerald-400/80">hash: </span>
                  <span className="text-foreground">{entry.hash}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Record Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('evidence.addEntryBtn')}
        maxWidth="md"
      >
        <form onSubmit={handleSaveEntry} className="space-y-4">
          <Select
            label={t('evidence.entryType')}
            value={entryType}
            onChange={(e) => setEntryType(e.target.value as EvidenceType)}
            options={[
              { value: 'note', label: t('evidence.typeNote') },
              { value: 'link_seen', label: t('evidence.typeLinkSeen') },
              { value: 'threat_received', label: t('evidence.typeThreatReceived') },
              { value: 'report_submitted', label: t('evidence.typeReportSubmitted') },
              { value: 'platform_reply', label: t('evidence.typePlatformReply') },
              { value: 'outcome', label: t('evidence.typeOutcome') },
            ]}
          />

          {entryType === 'link_seen' && (
            <Field
              label={t('evidence.fieldUrl')}
              type="url"
              required
              value={webUrl}
              onChange={(e) => setWebUrl(e.target.value)}
              placeholder="https://platform.com/post/xyz"
            />
          )}

          {entryType === 'threat_received' && (
            <div className="space-y-3">
              <Field
                label={t('evidence.fieldSender')}
                required
                value={senderHandle}
                onChange={(e) => setSenderHandle(e.target.value)}
                placeholder="User handle, telephone number, or anonymous ID"
              />
              <Field
                label={t('evidence.fieldDemand')}
                required
                value={demandText}
                onChange={(e) => setDemandText(e.target.value)}
                placeholder="e.g. Demanded money or more pictures"
              />
            </div>
          )}

          <TextArea
            label={t('evidence.fieldNotes')}
            required={entryType === 'note'}
            value={narrativeText}
            onChange={(e) => setNarrativeText(e.target.value)}
            placeholder="Record factual observations. DO NOT describe or paste explicit imagery."
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </Dialog>

      {/* File Hasher Dialog */}
      <Dialog
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        title={t('evidence.fileHasherTitle')}
        maxWidth="md"
      >
        <div className="space-y-4">
          <Banner variant="danger" title="Strict Safety Warning">
            {t('evidence.fileHasherNotice')}
          </Banner>

          <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-3">
            <input
              type="file"
              id="file-hash-input"
              className="hidden"
              onChange={handleFileSelected}
            />
            <label
              htmlFor="file-hash-input"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-surface border border-border transition-colors"
            >
              {isHashingFile ? 'Calculating SHA-256 Hash...' : t('evidence.selectFileBtn')}
            </label>
            <p className="text-xs text-muted-foreground">
              Select a screenshot of a threat or public message.
            </p>
          </div>

          {selectedFileResult && (
            <Card variant="accent" className="space-y-2 text-xs">
              <h5 className="font-bold text-sm text-foreground">
                {t('evidence.fileDetails')}
              </h5>
              <div className="font-mono space-y-1">
                <div>
                  <span className="text-muted-foreground">Name: </span>
                  <span>{selectedFileResult.fileName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Size: </span>
                  <span>{(selectedFileResult.fileSize / 1024).toFixed(2)} KB</span>
                </div>
                <div>
                  <span className="text-muted-foreground">SHA-256: </span>
                  <span className="text-primary font-bold break-all">
                    {selectedFileResult.sha256}
                  </span>
                </div>
              </div>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsFileModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={!selectedFileResult}
              onClick={handleAddFileHashToChain}
            >
              Add Hash to Evidence Chain →
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
