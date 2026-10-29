import type { EvidenceEntry, EvidenceType } from '../types';
import { sha256Hex } from './crypto';

export const GENESIS_PREV_HASH = '0'.repeat(64);

export function canonicalJsonStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return '[' + value.map((item) => canonicalJsonStringify(item)).join(',') + ']';
  }

  const keys = Object.keys(value as Record<string, unknown>).sort();
  const keyValues = keys.map((key) => {
    const val = (value as Record<string, unknown>)[key];
    return JSON.stringify(key) + ':' + canonicalJsonStringify(val);
  });

  return '{' + keyValues.join(',') + '}';
}

export interface EntryHashPayload {
  id: string;
  caseId: string;
  seq: number;
  createdAt: string;
  tzOffsetMinutes: number;
  type: EvidenceType;
  fields: Record<string, unknown>;
  prevHash: string;
}

export async function calculateEntryHash(payload: EntryHashPayload): Promise<string> {
  const canonicalData = canonicalJsonStringify(payload);
  const dataToHash = `${payload.prevHash}:${canonicalData}`;
  return sha256Hex(dataToHash);
}

export async function createEvidenceEntry(params: {
  id?: string;
  caseId: string;
  type: EvidenceType;
  fields: Record<string, unknown>;
  previousEntries: EvidenceEntry[];
}): Promise<EvidenceEntry> {
  const previousEntries = params.previousEntries;
  const seq = previousEntries.length + 1;
  const prevHash =
    previousEntries.length === 0
      ? GENESIS_PREV_HASH
      : (previousEntries[previousEntries.length - 1]?.hash ?? GENESIS_PREV_HASH);

  const now = new Date();
  const id = params.id || crypto.randomUUID();
  const createdAt = now.toISOString();
  const tzOffsetMinutes = -now.getTimezoneOffset();

  const payload: EntryHashPayload = {
    id,
    caseId: params.caseId,
    seq,
    createdAt,
    tzOffsetMinutes,
    type: params.type,
    fields: params.fields,
    prevHash,
  };

  const hash = await calculateEntryHash(payload);

  return {
    ...payload,
    hash,
  };
}

export interface ChainVerificationResult {
  isValid: boolean;
  brokenSeq?: number;
  error?: string;
}

export async function verifyEvidenceChain(
  entries: EvidenceEntry[],
): Promise<ChainVerificationResult> {
  if (entries.length === 0) {
    return { isValid: true };
  }

  // Sort by sequence number just in case
  const sorted = [...entries].sort((a, b) => a.seq - b.seq);

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    if (!entry) {
      return { isValid: false, brokenSeq: i + 1, error: 'Undefined entry encountered in chain' };
    }

    const expectedSeq = i + 1;
    if (entry.seq !== expectedSeq) {
      return {
        isValid: false,
        brokenSeq: entry.seq,
        error: `Sequence gap or mismatch: expected sequence #${expectedSeq}, got #${entry.seq}`,
      };
    }

    const expectedPrevHash = i === 0 ? GENESIS_PREV_HASH : sorted[i - 1]?.hash;
    if (entry.prevHash !== expectedPrevHash) {
      return {
        isValid: false,
        brokenSeq: entry.seq,
        error: `Previous hash pointer invalid at #${entry.seq}: expected ${expectedPrevHash}, found ${entry.prevHash}`,
      };
    }

    const payload: EntryHashPayload = {
      id: entry.id,
      caseId: entry.caseId,
      seq: entry.seq,
      createdAt: entry.createdAt,
      tzOffsetMinutes: entry.tzOffsetMinutes,
      type: entry.type,
      fields: entry.fields,
      prevHash: entry.prevHash,
    };

    const recomputedHash = await calculateEntryHash(payload);
    if (recomputedHash !== entry.hash) {
      return {
        isValid: false,
        brokenSeq: entry.seq,
        error: `Hash discrepancy detected at #${entry.seq}: stored ${entry.hash}, recomputed ${recomputedHash}`,
      };
    }
  }

  return { isValid: true };
}

export async function appendEvidenceEntry(
  caseId: string,
  type: EvidenceType,
  fields: Record<string, unknown>,
  key: CryptoKey,
): Promise<EvidenceEntry> {
  const { getEvidenceByCase, saveEvidenceEntry } = await import('./storage');
  const existing = await getEvidenceByCase(caseId, key);
  const entry = await createEvidenceEntry({
    caseId,
    type,
    fields,
    previousEntries: existing,
  });
  await saveEvidenceEntry(entry, key);
  return entry;
}

export async function verifyChain(
  caseId: string,
  key: CryptoKey,
): Promise<ChainVerificationResult> {
  const { getEvidenceByCase } = await import('./storage');
  const existing = await getEvidenceByCase(caseId, key);
  return verifyEvidenceChain(existing);
}


