import { describe, it, expect } from 'vitest';
import {
  canonicalJsonStringify,
  createEvidenceEntry,
  verifyEvidenceChain,
  GENESIS_PREV_HASH,
} from '../../src/lib/hashchain';
import type { EvidenceEntry } from '../../src/types';

describe('Tamper-Evident Hash Chain Engine', () => {
  it('deterministically sorts object keys in canonicalJsonStringify', () => {
    const objA = { b: 2, a: 1, nested: { z: 10, y: 20 } };
    const objB = { a: 1, nested: { y: 20, z: 10 }, b: 2 };

    expect(canonicalJsonStringify(objA)).toBe(canonicalJsonStringify(objB));
    expect(canonicalJsonStringify(objA)).toBe('{"a":1,"b":2,"nested":{"y":20,"z":10}}');
  });

  it('builds a verified sequential hash chain starting with genesis zeroes', async () => {
    const caseId = 'test-case-uuid-1';
    const entries: EvidenceEntry[] = [];

    // Entry 1
    const entry1 = await createEvidenceEntry({
      caseId,
      type: 'note',
      fields: { note: 'Initial incident report' },
      previousEntries: entries,
    });
    expect(entry1.seq).toBe(1);
    expect(entry1.prevHash).toBe(GENESIS_PREV_HASH);
    entries.push(entry1);

    // Entry 2
    const entry2 = await createEvidenceEntry({
      caseId,
      type: 'link_seen',
      fields: { url: 'https://example.com/post/1', platform: 'Instagram' },
      previousEntries: entries,
    });
    expect(entry2.seq).toBe(2);
    expect(entry2.prevHash).toBe(entry1.hash);
    entries.push(entry2);

    // Entry 3
    const entry3 = await createEvidenceEntry({
      caseId,
      type: 'report_submitted',
      fields: { reference: 'TKT-12345', platform: 'Instagram' },
      previousEntries: entries,
    });
    expect(entry3.seq).toBe(3);
    expect(entry3.prevHash).toBe(entry2.hash);
    entries.push(entry3);

    // Verify valid chain
    const verification = await verifyEvidenceChain(entries);
    expect(verification.isValid).toBe(true);
    expect(verification.brokenSeq).toBeUndefined();
  });

  it('detects tampering when field content is modified in an entry', async () => {
    const caseId = 'test-case-uuid-2';
    const entries: EvidenceEntry[] = [];

    const e1 = await createEvidenceEntry({
      caseId,
      type: 'note',
      fields: { text: 'Legitimate evidence entry' },
      previousEntries: entries,
    });
    entries.push(e1);

    const e2 = await createEvidenceEntry({
      caseId,
      type: 'threat_received',
      fields: { demand: 'Demanded 5000 INR' },
      previousEntries: entries,
    });
    entries.push(e2);

    // Tamper with e2 fields without recalculating hash
    const tamperedEntries = [...entries];
    const tamperedE2: EvidenceEntry = {
      ...e2,
      fields: { demand: 'Demanded 500000 INR' }, // Maliciously altered demand
    };
    tamperedEntries[1] = tamperedE2;

    const result = await verifyEvidenceChain(tamperedEntries);
    expect(result.isValid).toBe(false);
    expect(result.brokenSeq).toBe(2);
  });

  it('detects tampering when previous hash linkage is broken', async () => {
    const caseId = 'test-case-uuid-3';
    const entries: EvidenceEntry[] = [];

    const e1 = await createEvidenceEntry({
      caseId,
      type: 'note',
      fields: { text: 'Entry 1' },
      previousEntries: entries,
    });
    entries.push(e1);

    const e2 = await createEvidenceEntry({
      caseId,
      type: 'note',
      fields: { text: 'Entry 2' },
      previousEntries: entries,
    });
    entries.push(e2);

    // Tamper prevHash
    const tamperedEntries = [...entries];
    tamperedEntries[1] = {
      ...e2,
      prevHash: 'badf00d'.repeat(9) + 'bad',
    };

    const result = await verifyEvidenceChain(tamperedEntries);
    expect(result.isValid).toBe(false);
    expect(result.brokenSeq).toBe(2);
  });
});

