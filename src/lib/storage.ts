import { openDB, type IDBPDatabase } from 'idb';
import type {
  AuditEvent,
  CaseRecord,
  EncryptedPayload,
  EvidenceEntry,
  LinkRecord,
  PlaintextSettings,
  ReportRecord,
  Vault,
} from '../types';
import { decryptData, encryptData } from './crypto';

const DB_NAME = 'pratikar_vault_db';
const DB_VERSION = 1;

export class VaultLockedError extends Error {
  constructor(message = 'Vault is locked. Active encryption key required.') {
    super(message);
    this.name = 'VaultLockedError';
  }
}

interface StoredEncryptedRecord {
  id: string;
  caseId?: string;
  seq?: number;
  encrypted: EncryptedPayload;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Vault store: single record
        if (!db.objectStoreNames.contains('vault')) {
          db.createObjectStore('vault', { keyPath: 'id' });
        }

        // Settings store: unencrypted UI settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }

        // Cases store: encrypted
        if (!db.objectStoreNames.contains('cases')) {
          db.createObjectStore('cases', { keyPath: 'id' });
        }

        // Links store: encrypted with caseId index
        if (!db.objectStoreNames.contains('links')) {
          const linksStore = db.createObjectStore('links', { keyPath: 'id' });
          linksStore.createIndex('by_case', 'caseId');
        }

        // Reports store: encrypted with caseId index
        if (!db.objectStoreNames.contains('reports')) {
          const reportsStore = db.createObjectStore('reports', { keyPath: 'id' });
          reportsStore.createIndex('by_case', 'caseId');
        }

        // Evidence store: encrypted with caseId index
        if (!db.objectStoreNames.contains('evidence')) {
          const evidenceStore = db.createObjectStore('evidence', { keyPath: 'id' });
          evidenceStore.createIndex('by_case', 'caseId');
        }

        // Audit store: unencrypted timestamp-only log
        if (!db.objectStoreNames.contains('audit')) {
          db.createObjectStore('audit', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

/* ---------------- Vault Operations ---------------- */

export async function saveVaultMetadata(vault: Vault): Promise<void> {
  const db = await getDb();
  await db.put('vault', { id: 'primary', vault });
}

export async function getVaultMetadata(): Promise<Vault | null> {
  const db = await getDb();
  const record = (await db.get('vault', 'primary')) as { id: string; vault: Vault } | undefined;
  return record ? record.vault : null;
}

export async function hasVault(): Promise<boolean> {
  const vault = await getVaultMetadata();
  return vault !== null;
}

/* ---------------- Settings Operations (Plaintext) ---------------- */

export const DEFAULT_SETTINGS: PlaintextSettings = {
  language: 'en',
  textSize: 'normal',
  highContrast: false,
  reducedMotion: false,
  camouflageMode: false,
  autoLockMinutes: 5,
  quickExitUrl: 'https://www.google.com',
  devanagariNumerals: false,
};

export async function getSettings(): Promise<PlaintextSettings> {
  try {
    const db = await getDb();
    const record = (await db.get('settings', 'user_settings')) as
      | { id: string; settings: PlaintextSettings }
      | undefined;
    return record?.settings ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: PlaintextSettings): Promise<void> {
  const db = await getDb();
  await db.put('settings', { id: 'user_settings', settings });
}

/* ---------------- Cases Operations (Encrypted) ---------------- */

export async function saveCase(caseRecord: CaseRecord, key: CryptoKey): Promise<void> {
  if (!key) throw new VaultLockedError();
  const db = await getDb();
  const json = JSON.stringify(caseRecord);
  const encrypted = await encryptData(json, key);
  const stored: StoredEncryptedRecord = {
    id: caseRecord.id,
    encrypted,
  };
  await db.put('cases', stored);
}

export async function getCases(key: CryptoKey): Promise<CaseRecord[]> {
  if (!key) throw new VaultLockedError();
  const db = await getDb();
  const records = (await db.getAll('cases')) as StoredEncryptedRecord[];
  const cases: CaseRecord[] = [];

  for (const rec of records) {
    try {
      const decryptedJson = await decryptData(rec.encrypted, key);
      cases.push(JSON.parse(decryptedJson) as CaseRecord);
    } catch (err) {
      console.error(`Failed to decrypt case ${rec.id}:`, err);
    }
  }

  return cases.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getCaseById(caseId: string, key: CryptoKey): Promise<CaseRecord | null> {
  if (!key) throw new VaultLockedError();
  const db = await getDb();
  const record = (await db.get('cases', caseId)) as StoredEncryptedRecord | undefined;
  if (!record) return null;
  const decryptedJson = await decryptData(record.encrypted, key);
  return JSON.parse(decryptedJson) as CaseRecord;
}

export async function deleteCase(caseId: string, _key: CryptoKey): Promise<void> {
  const db = await getDb();
  await db.delete('cases', caseId);

  // Cascade delete associated links, reports, evidence
  const tx = db.transaction(['links', 'reports', 'evidence'], 'readwrite');
  const linksIndex = tx.objectStore('links').index('by_case');
  let linkCursor = await linksIndex.openCursor(caseId);
  while (linkCursor) {
    await linkCursor.delete();
    linkCursor = await linkCursor.continue();
  }

  const reportsIndex = tx.objectStore('reports').index('by_case');
  let reportCursor = await reportsIndex.openCursor(caseId);
  while (reportCursor) {
    await reportCursor.delete();
    reportCursor = await reportCursor.continue();
  }

  const evidenceIndex = tx.objectStore('evidence').index('by_case');
  let evidenceCursor = await evidenceIndex.openCursor(caseId);
  while (evidenceCursor) {
    await evidenceCursor.delete();
    evidenceCursor = await evidenceCursor.continue();
  }

  await tx.done;
}

/* ---------------- Links Operations (Encrypted) ---------------- */

export async function saveLink(linkRecord: LinkRecord, key: CryptoKey): Promise<void> {
  if (!key) throw new VaultLockedError();
  const db = await getDb();
  const encrypted = await encryptData(JSON.stringify(linkRecord), key);
  const stored: StoredEncryptedRecord = {
    id: linkRecord.id,
    caseId: linkRecord.caseId,
    encrypted,
  };
  await db.put('links', stored);
}

export async function getLinksByCase(caseId: string, key: CryptoKey): Promise<LinkRecord[]> {
  if (!key) throw new VaultLockedError();
  const db = await getDb();
  const records = (await db.getAllFromIndex('links', 'by_case', caseId)) as StoredEncryptedRecord[];
  const links: LinkRecord[] = [];

  for (const rec of records) {
    try {
      const decrypted = await decryptData(rec.encrypted, key);
      links.push(JSON.parse(decrypted) as LinkRecord);
    } catch (err) {
      console.error(`Failed to decrypt link ${rec.id}:`, err);
    }
  }

  return links;
}

export async function deleteLink(linkId: string): Promise<void> {
  const db = await getDb();
  await db.delete('links', linkId);
}

/* ---------------- Reports Operations (Encrypted) ---------------- */

export async function saveReport(reportRecord: ReportRecord, key: CryptoKey): Promise<void> {
  if (!key) throw new VaultLockedError();
  const db = await getDb();
  const encrypted = await encryptData(JSON.stringify(reportRecord), key);
  const stored: StoredEncryptedRecord = {
    id: reportRecord.id,
    caseId: reportRecord.caseId,
    encrypted,
  };
  await db.put('reports', stored);
}

export async function getReportsByCase(caseId: string, key: CryptoKey): Promise<ReportRecord[]> {
  if (!key) throw new VaultLockedError();
  const db = await getDb();
  const records = (await db.getAllFromIndex('reports', 'by_case', caseId)) as StoredEncryptedRecord[];
  const reports: ReportRecord[] = [];

  for (const rec of records) {
    try {
      const decrypted = await decryptData(rec.encrypted, key);
      reports.push(JSON.parse(decrypted) as ReportRecord);
    } catch (err) {
      console.error(`Failed to decrypt report ${rec.id}:`, err);
    }
  }

  return reports.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

/* ---------------- Evidence Operations (Encrypted) ---------------- */

export async function saveEvidenceEntry(entry: EvidenceEntry, key: CryptoKey): Promise<void> {
  if (!key) throw new VaultLockedError();
  const db = await getDb();
  const encrypted = await encryptData(JSON.stringify(entry), key);
  const stored: StoredEncryptedRecord = {
    id: entry.id,
    caseId: entry.caseId,
    seq: entry.seq,
    encrypted,
  };
  await db.put('evidence', stored);
}

export const saveEvidence = saveEvidenceEntry;

export async function getEvidenceByCase(caseId: string, key: CryptoKey): Promise<EvidenceEntry[]> {
  if (!key) throw new VaultLockedError();
  const db = await getDb();
  const records = (await db.getAllFromIndex('evidence', 'by_case', caseId)) as StoredEncryptedRecord[];
  const entries: EvidenceEntry[] = [];

  for (const rec of records) {
    try {
      const decrypted = await decryptData(rec.encrypted, key);
      entries.push(JSON.parse(decrypted) as EvidenceEntry);
    } catch (err) {
      console.error(`Failed to decrypt evidence ${rec.id}:`, err);
    }
  }

  return entries.sort((a, b) => a.seq - b.seq);
}

/* ---------------- Re-encrypt Vault (Passphrase Change) ---------------- */

export async function changeVaultPassphrase(
  oldKey: CryptoKey,
  newPassphrase: string,
): Promise<{ newKey: CryptoKey; newVault: Vault }> {
  if (!oldKey) throw new VaultLockedError();
  const db = await getDb();

  // 1. Fetch all records using old key
  const cases = await getCases(oldKey);
  const allLinks: LinkRecord[] = [];
  const allReports: ReportRecord[] = [];
  const allEvidence: EvidenceEntry[] = [];

  for (const c of cases) {
    const l = await getLinksByCase(c.id, oldKey);
    const r = await getReportsByCase(c.id, oldKey);
    const e = await getEvidenceByCase(c.id, oldKey);
    allLinks.push(...l);
    allReports.push(...r);
    allEvidence.push(...e);
  }

  // 2. Create new vault credentials with 600,000 iterations
  const { createVault } = await import('./crypto');
  const { vault: newVault, key: newKey } = await createVault(newPassphrase);

  // 3. Re-encrypt all records with new key
  for (const c of cases) {
    const encrypted = await encryptData(JSON.stringify(c), newKey);
    await db.put('cases', { id: c.id, encrypted });
  }

  for (const l of allLinks) {
    const encrypted = await encryptData(JSON.stringify(l), newKey);
    await db.put('links', { id: l.id, caseId: l.caseId, encrypted });
  }

  for (const r of allReports) {
    const encrypted = await encryptData(JSON.stringify(r), newKey);
    await db.put('reports', { id: r.id, caseId: r.caseId, encrypted });
  }

  for (const e of allEvidence) {
    const encrypted = await encryptData(JSON.stringify(e), newKey);
    await db.put('evidence', { id: e.id, caseId: e.caseId, seq: e.seq, encrypted });
  }

  // 4. Save new vault metadata
  await saveVaultMetadata(newVault);
  await logAuditEvent('unlock');

  return { newKey, newVault };
}

/* ---------------- Backup Export & Import ---------------- */

export interface BackupContainer {
  format: 'pratikar_encrypted_backup';
  schemaVersion: 1;
  createdAt: string;
  payload: EncryptedPayload;
}

export async function exportEncryptedBackup(key: CryptoKey): Promise<string> {
  if (!key) throw new VaultLockedError();
  const cases = await getCases(key);
  const links: LinkRecord[] = [];
  const reports: ReportRecord[] = [];
  const evidence: EvidenceEntry[] = [];

  for (const c of cases) {
    const l = await getLinksByCase(c.id, key);
    const r = await getReportsByCase(c.id, key);
    const e = await getEvidenceByCase(c.id, key);
    links.push(...l);
    reports.push(...r);
    evidence.push(...e);
  }

  const plainBackup = {
    cases,
    links,
    reports,
    evidence,
  };

  const encrypted = await encryptData(JSON.stringify(plainBackup), key);
  const container: BackupContainer = {
    format: 'pratikar_encrypted_backup',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    payload: encrypted,
  };

  await logAuditEvent('export');
  return JSON.stringify(container, null, 2);
}

export async function importEncryptedBackup(
  key: CryptoKey,
  jsonString: string,
): Promise<{ casesCount: number; evidenceCount: number }> {
  if (!key) throw new VaultLockedError();

  let container: unknown;
  try {
    container = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON file format.');
  }

  if (
    typeof container !== 'object' ||
    container === null ||
    (container as BackupContainer).format !== 'pratikar_encrypted_backup' ||
    (container as BackupContainer).schemaVersion !== 1
  ) {
    throw new Error('Unsupported or invalid backup format. Schema version must be 1.');
  }

  const validContainer = container as BackupContainer;
  let decrypted: string;
  try {
    decrypted = await decryptData(validContainer.payload, key);
  } catch {
    throw new Error('Failed to decrypt backup. The passphrase of this vault does not match the backup.');
  }

  const parsed = JSON.parse(decrypted) as {
    cases: CaseRecord[];
    links: LinkRecord[];
    reports: ReportRecord[];
    evidence: EvidenceEntry[];
  };

  if (!Array.isArray(parsed.cases) || !Array.isArray(parsed.evidence)) {
    throw new Error('Corrupted backup content structure.');
  }

  const db = await getDb();

  for (const c of parsed.cases) {
    await saveCase(c, key);
  }
  for (const l of parsed.links || []) {
    await saveLink(l, key);
  }
  for (const r of parsed.reports || []) {
    await saveReport(r, key);
  }
  for (const e of parsed.evidence || []) {
    const encrypted = await encryptData(JSON.stringify(e), key);
    await db.put('evidence', { id: e.id, caseId: e.caseId, seq: e.seq, encrypted });
  }

  await logAuditEvent('import');
  return {
    casesCount: parsed.cases.length,
    evidenceCount: parsed.evidence.length,
  };
}

/* ---------------- Demo Case (Section 20) ---------------- */

export const DEMO_CASE_ID = 'demo-case-pratikar-fictional-001';

export async function loadDemoCase(key: CryptoKey): Promise<CaseRecord> {
  if (!key) throw new VaultLockedError();
  const now = new Date();
  const submitted20hAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);
  const submitted30hAgo = new Date(now.getTime() - 30 * 60 * 60 * 1000);

  const demoCase: CaseRecord = {
    id: DEMO_CASE_ID,
    nickname: 'DEMO CASE - NOT REAL',
    createdAt: submitted30hAgo.toISOString(),
    updatedAt: now.toISOString(),
    mode: 'self',
    situation: ['threatened', 'morphed'],
    platforms: ['instagram', 'x'],
    demandsMade: {
      money: true,
      moreImages: true,
      other: false,
      notes: 'Demo extortion threat via anonymous handle. Demanded funds within 24h.',
    },
    offenderKnown: 'unknown',
    identifiers: ['@fictional_demo_handle', '+91 99999 00000'],
    personalDetails: {
      name: 'Sample Complainant (Demo)',
      email: 'demo@example.org',
    },
    status: 'active',
  };

  const demoLink1: LinkRecord = {
    id: 'demo-link-1',
    caseId: DEMO_CASE_ID,
    url: 'https://example.com/demo-post-1',
    platform: 'Instagram',
    firstSeenAt: submitted30hAgo.toISOString(),
    notes: 'Fictional demo URL for testing',
    status: 'visible',
  };

  const demoLink2: LinkRecord = {
    id: 'demo-link-2',
    caseId: DEMO_CASE_ID,
    url: 'https://example.org/demo-post-2',
    platform: 'X',
    firstSeenAt: submitted30hAgo.toISOString(),
    notes: 'Fictional demo URL for testing',
    status: 'visible',
  };

  // Pending report (4h remaining of 24h window)
  const demoReportPending: ReportRecord = {
    id: 'demo-report-pending',
    caseId: DEMO_CASE_ID,
    platform: 'Instagram',
    channel: 'platform',
    submittedAt: submitted20hAgo.toISOString(),
    dueAt: new Date(submitted20hAgo.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    referenceNumber: 'IG-DEMO-REF-9876',
    linkIds: [demoLink1.id],
    outcome: 'pending',
    notes: 'Submitted via in-app reporting tool',
  };

  // Overdue report (submitted 30h ago, due 6h ago -> triggers escalation ladder!)
  const demoReportOverdue: ReportRecord = {
    id: 'demo-report-overdue',
    caseId: DEMO_CASE_ID,
    platform: 'X',
    channel: 'followup',
    submittedAt: submitted30hAgo.toISOString(),
    dueAt: new Date(submitted30hAgo.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    referenceNumber: 'X-DEMO-TICKET-5432',
    linkIds: [demoLink2.id],
    outcome: 'noResponse',
    notes: 'Platform missed 24h deadline; requires Grievance Officer and GAC escalation.',
  };

  await saveCase(demoCase, key);
  await saveLink(demoLink1, key);
  await saveLink(demoLink2, key);
  await saveReport(demoReportPending, key);
  await saveReport(demoReportOverdue, key);

  // Add initial hash-chained evidence
  const { appendEvidenceEntry } = await import('./hashchain');
  await appendEvidenceEntry(
    DEMO_CASE_ID,
    'threat_received',
    {
      sender: '@fictional_demo_handle',
      messageText: 'Send payment or morphed image will be posted on social media (DEMO DATA)',
      receivedAt: submitted30hAgo.toISOString(),
    },
    key,
  );

  return demoCase;
}

export async function removeDemoCase(key: CryptoKey): Promise<void> {
  if (!key) throw new VaultLockedError();
  const db = await getDb();
  await db.delete('cases', DEMO_CASE_ID);

  // Clean associated links, reports, and evidence
  const links = (await db.getAllFromIndex('links', 'by_case', DEMO_CASE_ID)) as StoredEncryptedRecord[];
  for (const l of links) await db.delete('links', l.id);

  const reports = (await db.getAllFromIndex('reports', 'by_case', DEMO_CASE_ID)) as StoredEncryptedRecord[];
  for (const r of reports) await db.delete('reports', r.id);

  const evidence = (await db.getAllFromIndex('evidence', 'by_case', DEMO_CASE_ID)) as StoredEncryptedRecord[];
  for (const e of evidence) await db.delete('evidence', e.id);
}

/* ---------------- Audit Events (Unencrypted Timestamps Only) ---------------- */

export async function logAuditEvent(type: AuditEvent['type']): Promise<void> {
  try {
    const db = await getDb();
    const event: AuditEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date().toISOString(),
    };
    await db.put('audit', event);
  } catch (err) {
    console.warn('Failed to record audit event:', err);
  }
}

export async function getAuditEvents(): Promise<AuditEvent[]> {
  try {
    const db = await getDb();
    return (await db.getAll('audit')) as AuditEvent[];
  } catch {
    return [];
  }
}

/* ---------------- Emergency Wipe ---------------- */

export async function wipeAllData(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }

  // Delete IndexedDB database completely
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve(); // proceeding even if blocked
  });

  // Clear any potential session or local items
  localStorage.clear();
  sessionStorage.clear();
}

