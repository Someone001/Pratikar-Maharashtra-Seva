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
