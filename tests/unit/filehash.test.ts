import { describe, it, expect } from 'vitest';
import { hashFileLocally } from '../../src/lib/filehash';
import { sha256Hex } from '../../src/lib/crypto';

describe('Local File Hasher Utility', () => {
  it('computes sha256 hash and metadata for a client file in memory', async () => {
    const fileContent = 'Screenshot metadata 2026-10-29 evidence test';
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const file = new File([blob], 'screenshot_proof.txt', {
      type: 'text/plain',
      lastModified: 1700000000000,
    });

    const expectedHash = await sha256Hex(fileContent);
    const result = await hashFileLocally(file);

    expect(result.fileName).toBe('screenshot_proof.txt');
    expect(result.fileSize).toBe(fileContent.length);
    expect(result.fileType).toBe('text/plain');
    expect(result.lastModified).toBe(1700000000000);
    expect(result.sha256).toBe(expectedHash);
  });
});
