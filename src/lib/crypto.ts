import type { EncryptedPayload, Vault } from '../types';

const VERIFIER_SENTINEL = 'PRATIKAR_VAULT_VERIFIED_V1';
export const DEFAULT_PBKDF2_ITERATIONS = 600000;
const PBKDF2_ITERATIONS = DEFAULT_PBKDF2_ITERATIONS;

export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    const b = bytes[i];
    if (b !== undefined) {
      binary += String.fromCharCode(b);
    }
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function generateSalt(length = 16): Uint8Array {
  const salt = new Uint8Array(length);
  crypto.getRandomValues(salt);
  return salt;
}

export function generateIv(length = 12): Uint8Array {
  const iv = new Uint8Array(length);
  crypto.getRandomValues(iv);
  return iv;
}

export async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations = PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptData(
  plaintext: string,
  key: CryptoKey,
): Promise<EncryptedPayload> {
  const iv = generateIv(12);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(plaintext);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoded,
  );

  return {
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertextBuffer),
  };
}

export async function decryptData(
  payload: EncryptedPayload,
  key: CryptoKey,
): Promise<string> {
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.ciphertext);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    ciphertext,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

export async function sha256Hex(data: string | ArrayBuffer | Uint8Array): Promise<string> {
  let buffer: ArrayBuffer;
  if (typeof data === 'string') {
    buffer = new TextEncoder().encode(data).buffer;
  } else if (data instanceof Uint8Array) {
    buffer = data.buffer as ArrayBuffer;
  } else {
    buffer = data;
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function createVault(
  passphrase: string,
): Promise<{ vault: Vault; key: CryptoKey }> {
  const salt = generateSalt(16);
  const key = await deriveKey(passphrase, salt, PBKDF2_ITERATIONS);
  const verifier = await encryptData(VERIFIER_SENTINEL, key);

  const vault: Vault = {
    version: 1,
    kdf: {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: PBKDF2_ITERATIONS,
      salt: bufferToBase64(salt),
    },
    verifier,
    createdAt: new Date().toISOString(),
  };

  return { vault, key };
}

export async function unlockVault(
  passphrase: string,
  vault: Vault,
): Promise<CryptoKey | null> {
  try {
    const salt = base64ToBuffer(vault.kdf.salt);
    const key = await deriveKey(passphrase, salt, vault.kdf.iterations);
    const decryptedSentinel = await decryptData(vault.verifier, key);

    if (constantTimeCompare(decryptedSentinel, VERIFIER_SENTINEL)) {
      return key;
    }
    return null;
  } catch {
    return null;
  }
}

