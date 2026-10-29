import { describe, it, expect } from 'vitest';
import {
  deriveKey,
  generateSalt,
  encryptData,
  decryptData,
  sha256Hex,
  constantTimeCompare,
  createVault,
  unlockVault,
} from '../../src/lib/crypto';

describe('Web Crypto Engine', () => {
  it('generates random salts of specified length', () => {
    const salt1 = generateSalt(16);
    const salt2 = generateSalt(16);
    expect(salt1.byteLength).toBe(16);
    expect(salt2.byteLength).toBe(16);
    expect(salt1).not.toEqual(salt2);
  });

  it('derives CryptoKey from passphrase with PBKDF2', async () => {
    const salt = generateSalt(16);
    const key = await deriveKey('correct-horse-battery-staple', salt, 1000);
    expect(key).toBeDefined();
    expect(key.algorithm.name).toBe('AES-GCM');
  });

  it('encrypts and decrypts string payloads with AES-256-GCM', async () => {
    const salt = generateSalt(16);
    const key = await deriveKey('strong-passphrase-test', salt, 1000);
    const message = 'Confidential incident details for 24-hour notice';

    const encrypted = await encryptData(message, key);
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.ciphertext).not.toBe(message);

    const decrypted = await decryptData(encrypted, key);
    expect(decrypted).toBe(message);
  });

  it('fails decryption if wrong key is provided', async () => {
    const salt1 = generateSalt(16);
    const salt2 = generateSalt(16);
    const key1 = await deriveKey('correct-key', salt1, 1000);
    const key2 = await deriveKey('wrong-key', salt2, 1000);

    const encrypted = await encryptData('secret text', key1);
    await expect(decryptData(encrypted, key2)).rejects.toThrow();
  });

  it('computes correct SHA-256 hex string', async () => {
    // SHA-256("test") = 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
    const hash = await sha256Hex('test');
    expect(hash).toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
  });

  it('performs constant time string comparison', () => {
    expect(constantTimeCompare('abc', 'abc')).toBe(true);
    expect(constantTimeCompare('abc', 'abd')).toBe(false);
    expect(constantTimeCompare('abc', 'ab')).toBe(false);
  });

  it('creates vault and unlocks with valid passphrase, fails with incorrect passphrase', async () => {
    const passphrase = 'my-secure-vault-passphrase';
    const { vault, key } = await createVault(passphrase);

    expect(vault.version).toBe(1);
    expect(vault.kdf.iterations).toBe(600000); // Section 14: at least 600,000 iterations
    expect(vault.kdf.salt).toBeDefined();
    expect(key).toBeDefined();

    // Unlock with matching passphrase
    const unlockedKey = await unlockVault(passphrase, vault);
    expect(unlockedKey).not.toBeNull();

    // Unlock with wrong passphrase
    const badKey = await unlockVault('wrong-passphrase', vault);
    expect(badKey).toBeNull();
  });
});

