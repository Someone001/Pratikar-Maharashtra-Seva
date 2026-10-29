import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Ensure Web Crypto API is accessible in jsdom test environment
if (!globalThis.crypto.subtle && globalThis.crypto) {
  // @ts-expect-error Node webcrypto fallback
  globalThis.crypto.subtle = globalThis.crypto.webcrypto?.subtle;
}
