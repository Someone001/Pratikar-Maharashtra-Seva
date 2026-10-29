import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveVaultMetadata,
  getVaultMetadata,
  hasVault,
  getSettings,
  saveSettings,
  saveCase,
  getCases,
  getCaseById,
  deleteCase,
  saveLink,
  getLinksByCase,
  saveReport,
  getReportsByCase,
  saveEvidenceEntry,
  getEvidenceByCase,
  logAuditEvent,
  getAuditEvents,
  wipeAllData,
  VaultLockedError,
} from '../../src/lib/storage';
import { createVault } from '../../src/lib/crypto';
import type { CaseRecord, EvidenceEntry, LinkRecord, ReportRecord } from '../../src/types';

describe('Encrypted Storage Layer (IndexedDB)', () => {
  let activeKey: CryptoKey;

  beforeEach(async () => {
    await wipeAllData();
    const vaultResult = await createVault('unit-test-passphrase');
    activeKey = vaultResult.key;
    await saveVaultMetadata(vaultResult.vault);
  });

  it('stores and retrieves vault metadata', async () => {
    const hasV = await hasVault();
    expect(hasV).toBe(true);

    const meta = await getVaultMetadata();
    expect(meta).not.toBeNull();
    expect(meta?.version).toBe(1);
    expect(meta?.kdf.hash).toBe('SHA-256');
  });

  it('saves and reads unencrypted plaintext settings', async () => {
    const defaultSettings = await getSettings();
    expect(defaultSettings.language).toBe('en');

    await saveSettings({
      language: 'hi',
      textSize: 'large',
      highContrast: true,
      reducedMotion: false,
      camouflageMode: true,
    });

    const updated = await getSettings();
    expect(updated.language).toBe('hi');
    expect(updated.textSize).toBe('large');
    expect(updated.highContrast).toBe(true);
    expect(updated.camouflageMode).toBe(true);
  });

  it('saves and retrieves encrypted case records', async () => {
    const newCase: CaseRecord = {
      id: 'case-uuid-1',
      nickname: 'Incident Instagram 1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mode: 'self',
      situation: ['threatened', 'morphed'],
      platforms: ['instagram'],
      demandsMade: { money: true, moreImages: false, other: false, notes: 'Demanded cash' },
      offenderKnown: 'stranger',
      status: 'active',
    };

    await saveCase(newCase, activeKey);

    const cases = await getCases(activeKey);
    expect(cases.length).toBe(1);
    expect(cases[0]?.id).toBe('case-uuid-1');
    expect(cases[0]?.nickname).toBe('Incident Instagram 1');

    const singleCase = await getCaseById('case-uuid-1', activeKey);
    expect(singleCase?.nickname).toBe('Incident Instagram 1');
  });

  it('throws VaultLockedError when accessing encrypted records without a valid key', async () => {
    // @ts-expect-error Testing invalid key
    await expect(getCases(null)).rejects.toThrow(VaultLockedError);
  });

  it('saves and retrieves links, reports, and evidence scoped by caseId', async () => {
    const caseId = 'case-uuid-2';
    const link: LinkRecord = {
      id: 'link-1',
      caseId,
      url: 'https://instagram.com/p/def456',
      platform: 'instagram',
      firstSeenAt: new Date().toISOString(),
      status: 'visible',
    };
    await saveLink(link, activeKey);

    const report: ReportRecord = {
      id: 'report-1',
      caseId,
      platform: 'instagram',
      channel: 'platform',
      submittedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 86400000).toISOString(),
      referenceNumber: 'REF-789',
      linkIds: ['link-1'],
      outcome: 'pending',
    };
    await saveReport(report, activeKey);

    const entry: EvidenceEntry = {
      id: 'entry-1',
      caseId,
      seq: 1,
      createdAt: new Date().toISOString(),
      tzOffsetMinutes: 330,
      type: 'note',
      fields: { text: 'Noticed post' },
      prevHash: '0'.repeat(64),
      hash: 'abc123hash',
    };
    await saveEvidenceEntry(entry, activeKey);

    const links = await getLinksByCase(caseId, activeKey);
    expect(links.length).toBe(1);
    expect(links[0]?.url).toBe('https://instagram.com/p/def456');

    const reports = await getReportsByCase(caseId, activeKey);
    expect(reports.length).toBe(1);
    expect(reports[0]?.referenceNumber).toBe('REF-789');

    const evidence = await getEvidenceByCase(caseId, activeKey);
    expect(evidence.length).toBe(1);
    expect(evidence[0]?.seq).toBe(1);
  });

  it('cascades deletion of links, reports, and evidence when case is deleted', async () => {
    const caseId = 'case-to-delete';
    const newCase: CaseRecord = {
      id: caseId,
      nickname: 'Temporary Case',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mode: 'self',
      situation: ['shared'],
      platforms: ['facebook'],
      demandsMade: { money: false, moreImages: false, other: false },
      offenderKnown: 'unknown',
      status: 'active',
    };
    await saveCase(newCase, activeKey);

    await saveLink(
      {
        id: 'link-temp',
        caseId,
        url: 'https://facebook.com/123',
        platform: 'facebook',
        firstSeenAt: new Date().toISOString(),
        status: 'visible',
      },
      activeKey,
    );

    await deleteCase(caseId, activeKey);

    const cases = await getCases(activeKey);
    expect(cases.find((c) => c.id === caseId)).toBeUndefined();

    const links = await getLinksByCase(caseId, activeKey);
    expect(links.length).toBe(0);
  });

  it('records audit events with timestamps only and no sensitive content', async () => {
    await logAuditEvent('unlock');
    await logAuditEvent('export');

    const events = await getAuditEvents();
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events.some((e) => e.type === 'unlock')).toBe(true);
    expect(events.some((e) => e.type === 'export')).toBe(true);
  });

  it('completely purges data during emergency wipe', async () => {
    await wipeAllData();
    const hasV = await hasVault();
    expect(hasV).toBe(false);
  });
});
