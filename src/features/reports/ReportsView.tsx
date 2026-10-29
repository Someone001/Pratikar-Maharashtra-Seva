import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../lib/i18n';
import { useVault } from '../vault/VaultContext';
import { getReportsByCase, saveReport, getLinksByCase } from '../../lib/storage';
import type {
  CaseRecord,
  LinkRecord,
  ReportChannel,
  ReportOutcome,
  ReportRecord,
} from '../../types';
import platformsData from '../../data/platforms.json';
import { generate24HourIcsFile, downloadIcsFile } from '../../lib/ics';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Field,
  Select,
  Dialog,
  Badge,
  Countdown,
  Banner,
} from '../../components';

export interface ReportsViewProps {
  activeCase: CaseRecord | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ activeCase }) => {
  const { t } = useI18n();
  const { activeKey } = useVault();

  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ReportRecord | null>(null);

  // Form State
  const [platform, setPlatform] = useState('Instagram');
  const [channel, setChannel] = useState<ReportChannel>('platform');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [submittedAt, setSubmittedAt] = useState('');
  const [outcome, setOutcome] = useState<ReportOutcome>('pending');
  const [notes, setNotes] = useState('');

  const loadReports = useCallback(async () => {
    if (!activeCase || !activeKey) return;
    try {
      const reps = await getReportsByCase(activeCase.id, activeKey);
      setReports(reps);
      const lks = await getLinksByCase(activeCase.id, activeKey);
      setLinks(lks);
    } catch (err) {
      console.error('Failed to load reports:', err);
    }
  }, [activeCase, activeKey]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  if (!activeCase) {
    return (
      <Card variant="muted" className="p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Please select or create a case first to manage 24-hour statutory notices.
        </p>
      </Card>
    );
  }

  const openCreateModal = () => {
    setEditingReport(null);
    setPlatform(activeCase.platforms[0] ? activeCase.platforms[0] : 'Instagram');
    setChannel('platform');
    setReferenceNumber('');
    setSubmittedAt(new Date().toISOString().slice(0, 16)); // format for datetime-local
    setOutcome('pending');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (r: ReportRecord) => {
    setEditingReport(r);
    setPlatform(r.platform);
    setChannel(r.channel);
    setReferenceNumber(r.referenceNumber || '');
    setSubmittedAt(new Date(r.submittedAt).toISOString().slice(0, 16));
    setOutcome(r.outcome);
    setNotes(r.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeKey) return;

    const subDate = submittedAt ? new Date(submittedAt) : new Date();
    const dueAt = new Date(subDate.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const reportRecord: ReportRecord = {
      id: editingReport ? editingReport.id : crypto.randomUUID(),
      caseId: activeCase.id,
      platform,
      channel,
      submittedAt: subDate.toISOString(),
      dueAt,
      referenceNumber: referenceNumber.trim() || undefined,
      linkIds: links.map((l) => l.id),
      outcome,
      outcomeAt: outcome !== 'pending' ? new Date().toISOString() : undefined,
      notes: notes.trim() || undefined,
    };

    await saveReport(reportRecord, activeKey);
    setIsModalOpen(false);
    await loadReports();
  };

  const handleDownloadIcs = (r: ReportRecord) => {
    const icsContent = generate24HourIcsFile({
      platformName: r.platform,
      submittedAt: r.submittedAt,
      referenceNumber: r.referenceNumber,
    });
    downloadIcsFile(`takedown-deadline-${r.platform}.ics`, icsContent);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('reports.title')}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">{t('reports.subtitle')}</p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<span>+</span>}>
          {t('reports.newReportBtn')}
        </Button>
      </div>

      <Banner variant="info" title="Statutory 24-Hour Mandate">
        Under Rule 3(2)(b) of the Information Technology Rules, 2021, intermediaries must remove or disable access to reported intimate content within 24 hours of notification. If they fail to act, proceed with Grievance Appellate Committee (GAC) appeal and NCRP 1930 escalation.
      </Banner>

      {reports.length === 0 ? (
        <Card variant="muted" className="p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            No takedown notices logged for &apos;{activeCase.nickname}&apos; yet.
          </p>
          <Button onClick={openCreateModal}>{t('reports.newReportBtn')}</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => {
            return (
              <Card key={r.id} className="border-border shadow-sm">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-bold capitalize">
                          {r.platform}
                        </CardTitle>
                        <Badge
                          variant={
                            r.outcome === 'removed'
                              ? 'verified'
                              : r.outcome === 'rejected' || r.outcome === 'noResponse'
                                ? 'danger'
                                : 'warning'
                          }
                          size="sm"
                        >
                          {r.outcome.toUpperCase()}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        Channel: {r.channel} • Submitted:{' '}
                        {new Date(r.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </CardDescription>
                    </div>

                    {r.referenceNumber && (
                      <div className="rounded bg-surface px-2.5 py-1 text-xs font-mono text-primary font-bold self-start sm:self-center">
                        Ticket: {r.referenceNumber}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Countdown Timer */}
                  <Countdown submittedAt={r.submittedAt} dueAt={r.dueAt} />

                  {r.notes && (
                    <div className="rounded-lg bg-surface/40 p-3 text-xs text-foreground/90">
                      <span className="font-semibold text-muted-foreground">Notes: </span>
                      {r.notes}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex flex-wrap items-center justify-between gap-2 pt-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadIcs(r)}
                      leftIcon={<span>📅</span>}
                    >
                      {t('reports.downloadIcs')}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEditModal(r)}>
                      Update Outcome
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Log / Edit Notice Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingReport ? 'Update Notice Outcome' : t('reports.newReportBtn')}
        maxWidth="md"
      >
        <form onSubmit={handleSaveReport} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label={t('reports.platform')}
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              options={platformsData.map((p) => ({
                value: p.displayName,
                label: p.displayName,
              }))}
            />

            <Select
              label={t('reports.channel')}
              value={channel}
              onChange={(e) => setChannel(e.target.value as ReportChannel)}
              options={[
                { value: 'platform', label: t('reports.channelPlatform') },
                { value: 'followup', label: t('reports.channelFollowup') },
                { value: 'escalation', label: t('reports.channelEscalation') },
                { value: 'ncrp', label: t('reports.channelNcrp') },
                { value: 'police', label: t('reports.channelPolice') },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label={t('reports.submittedAt')}
              type="datetime-local"
              required
              value={submittedAt}
              onChange={(e) => setSubmittedAt(e.target.value)}
            />

            <Field
              label={t('reports.referenceNumber')}
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder={t('reports.referencePlaceholder')}
              hint="Platform complaint ticket ID"
            />
          </div>

          <Select
            label={t('reports.outcome')}
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as ReportOutcome)}
            options={[
              { value: 'pending', label: t('reports.outcomePending') },
              { value: 'acknowledged', label: t('reports.outcomeAcknowledged') },
              { value: 'removed', label: t('reports.outcomeRemoved') },
              { value: 'partial', label: t('reports.outcomePartial') },
              { value: 'rejected', label: t('reports.outcomeRejected') },
              { value: 'noResponse', label: t('reports.outcomeNoResponse') },
            ]}
          />

          <Field
            label="Notes / Response Summary"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Email received from Grievance Desk confirming review"
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('reports.saveReportBtn')}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

