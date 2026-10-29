# Privacy Architecture & Data Protection in Pratikar (प्रतिकार)

**Last Updated:** 2026-10-29  
**Application Scope:** Static, client-side Progressive Web Application (PWA)

---

## 1. Executive Summary

Pratikar is engineered under a strict **Zero-Knowledge, Zero-Cloud, Zero-Network-Leakage** privacy paradigm. It was built specifically to empower individuals facing intimate image abuse, non-consensual intimate imagery (NCII), sextortion, and deepfakes without creating new attack surfaces, surveillance logs, or data trails.

### Core Privacy Guarantees
1. **Zero Server Architecture**: There is no remote backend, application server, API gateway, telemetry collector, or database. The application consists entirely of pre-compiled static files (HTML, JS, CSS, WOFF2 fonts, JSON).
2. **Absolute Zero Intimate Media Storage Policy**: The application **never** receives, captures, uploads, or stores photos or videos. File hashing is performed ephemerally in browser RAM (`crypto.subtle.digest('SHA-256', ...)`) and the raw byte array is discarded immediately via garbage collection. Only metadata (filename, size, type, timestamp, SHA-256 hash) is stored.
3. **Hardware & Origin Isolation**: All case records, evidence ledgers, and contact drafts reside strictly inside the user's browser IndexedDB, accessible only through the exact `origin` and encrypted at rest.
4. **Deterministic Client-Side Cryptography**: Encryption keys are derived using PBKDF2 with 600,000 iterations and salt. Data is encrypted using authenticated AES-256-GCM. The active key exists only in volatile JavaScript execution memory and is purged upon lock, timeout, or Quick Exit.

---

## 2. Data Flow Architecture

```
User Device (Browser Sandbox)
┌────────────────────────────────────────────────────────┐
│ 1. User Input (Text Metadata, Links, Notes)            │
│ 2. Ephemeral In-Memory File Hasher (Web Crypto SHA-256)│
│    └── [Raw File ArrayBuffer Immediately Discarded]     │
│ 3. Passphrase Entry ──> PBKDF2 (600,000 iter) ──> Key  │
│ 4. Plaintext JSON + Key ──> AES-256-GCM (12-byte IV)   │
│ 5. Ciphertext ──> IndexedDB ('pratikar_db_v1')         │
└────────────────────────────────────────────────────────┘
                           │
                 [STRICT CSP BARRIER]
               connect-src 'self' (No HTTP, WebSocket, Analytics)
                           │
                           ▼
                    [EXTERNAL NETWORK]
                (Zero Requests Emitted)
```

---

## 3. How Data is Stored, Encrypted, and Wiped

### 3.1 Vault Encryption at Rest
- **Key Derivation Function (KDF)**: PBKDF2-HMAC-SHA256.
- **Iterations**: 600,000 iterations (exceeding OWASP 2023 recommendations of 600,000 iterations for PBKDF2-HMAC-SHA256).
- **Salt**: 16 bytes of cryptographically secure pseudo-random bytes generated via `crypto.getRandomValues(new Uint8Array(16))`.
- **Cipher**: AES-256-GCM with a 12-byte unique Initialization Vector (IV) generated per write operation.
- **Verification Tag**: A known verification string is encrypted alongside the master key during vault creation. Upon unlocking, decryption of this token validates passphrase correctness in memory before any case record is accessed.

### 3.2 IndexedDB Schema ('pratikar_db_v1')
All application storage is compartmentalized into encrypted object stores:
- `vault`: Holds vault metadata (`salt`, `iv`, `verificationCiphertext`, `createdAt`, `kdfIterations`). Contains **zero plaintext credentials**.
- `cases`: Holds individual incident cases encrypted with AES-256-GCM.
- `links`: Holds flagged URLs and lookalike homoglyph metadata encrypted with AES-256-GCM.
- `reports`: Holds formal 24-hour statutory notice submissions and tracking dates encrypted with AES-256-GCM.
- `evidence`: Holds the SHA-256 tamper-evident hash chain ledger entries encrypted with AES-256-GCM.
- `settings`: Holds non-sensitive interface preferences (language, auto-lock duration, text size, high contrast mode, camouflage state) in plaintext.
- `audit`: Holds append-only timestamps and event codes (e.g., `VAULT_UNLOCKED`, `RECORD_ADDED`) encrypted with AES-256-GCM.

### 3.3 Memory Hygiene & Inactivity Locking
- The active `CryptoKey` object is maintained only inside React Context closure memory (`activeKey`).
- Locking the vault (`lock()`) immediately sets `activeKey = null` and broadcasts a lock event across open browser tabs using `BroadcastChannel('pratikar_vault_channel')`.
- Inactivity auto-lock triggers automatically after the configured inactivity threshold (1 min, 5 min, 15 min; default 5 minutes). Inactivity listeners monitor pointer movement, clicks, touches, and keystrokes.
- **Quick Exit (Panic Mode)**: Activated via double-Escape (`Esc` `Esc`), a persistent floating "Quick Exit" button, or UI action:
  1. Purges `activeKey` to `null`.
  2. Clears volatile React state and unsaved drafts in `localStorage`.
  3. Replaces browser history via `window.location.replace(quickExitUrl)` (defaulting to Indian Meteorological Department weather forecast `https://mausam.imd.gov.in` or Wikipedia).

### 3.4 Complete Vault Wiping (Data Destruction)
- A user can destroy all local data at any time from Settings or after repeated incorrect unlock attempts.
- Deletion requires explicitly typing `DELETE` into a confirmation dialog.
- The wipe procedure:
  1. Closes and deletes the IndexedDB database (`window.indexedDB.deleteDatabase('pratikar_db_v1')`).
  2. Clears `localStorage` and `sessionStorage`.
  3. Unregisters active Service Workers.
  4. Flushes the CacheStorage API.
  5. Navigates to a blank URL or reloads to a clean slate.

---

## 4. What an Attacker Can and Cannot See

| Attacker Profile | What They CAN See | What They CANNOT See |
| :--- | :--- | :--- |
| **Physical Device Snooper (Phone Left Unlocked)** | Only the screen currently displayed. If auto-lock fired, only the unlock prompt or disguise note screen. | Case records, perpetrator handles, or links unless they possess the master passphrase. |
| **Forensic Extractor (Root / Storage Inspection)** | Raw IndexedDB binary files containing salt, IVs, AES-256-GCM ciphertext blocks, and settings (chosen UI language). | Case titles, notes, threat records, perpetrator identifiers, or unencrypted evidence logs without brute-forcing 600,000 PBKDF2 iterations. |
| **Network Observer (ISP / Wi-Fi Router)** | Initial static PWA bundle download (HTML, CSS, JS, WOFF2). User visits to official external links (e.g. `cybercrime.gov.in`). | Any complaint drafts, case details, evidence hashes, or passwords (zero network requests sent). |
| **Tech Platform / Intermediary** | Only the formal notice text the user explicitly decides to copy and submit to their grievance officer. | Other platforms reported, evidence logs, notes, or unrelated case history. |

---

## 5. What Pratikar NEVER Does

1. **Never transmits data over the Internet**: The Content Security Policy (`connect-src 'self'`) prevents all background network requests, analytics, error reporting, or third-party pings.
2. **Never accepts or stores intimate photos or videos**: Intimate media is hazardous to store on consumer devices under threat. The app explicitly restricts evidence intake to text, URLs, and memory-only SHA-256 hashes.
3. **Never connects to government or police databases**: Pratikar is completely uncoupled from government surveillance and platform APIs. It does not auto-file complaints or query police logs.
4. **Never uses cookies or persistent device trackers**: The app operates statelessly without session cookies, third-party trackers, or device fingerprinting.
