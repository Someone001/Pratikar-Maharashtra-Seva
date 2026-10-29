# Pratikar Threat Model & Adversary Analysis

**Version:** 1.0.0  
**Target Threat Environment:** Digital blackmail, sextortion, non-consensual intimate imagery (NCII), deepfake defamation in India.

---

## 1. Threat Modeling Overview

Victims of non-consensual intimate imagery and digital blackmail face hostile environments that extend beyond traditional cybersecurity attack vectors. Perpetrators often include abusive domestic partners, acquaintances with physical access to the device, anonymous extortionists on social media platforms, and coercive actors demanding money or more media.

Pratikar models five distinct adversary classes:
1. **The Intimate / Domestic Snooper (Abusive Partner, Household Member)**
2. **The Hardware / Forensic Extractor (Seized Device or Phone Repair Shop)**
3. **The Network Observer (Local Wi-Fi Operator, ISP, MITM)**
4. **The Hostile Platform / Intermediary Operator**
5. **The Coercive Blackmailer (Extortionist Demanding Money or Imagery)**

---

## 2. Adversary Analysis & Defences

### 2.1 Adversary 1: The Intimate / Domestic Snooper
* **Profile**: An abusive partner, family member, or roommate who has occasional physical access to the victim's unlocked or locked phone. They may pick up the phone when the victim leaves the room or demand to see the phone screen.
* **Objective**: Discover if the victim is documenting their abuse, preparing a police report, or seeking assistance.
* **Defences**:
  * **Disguise / Camouflage Mode**: A single-toggle camouflage mode transforms the app's brand, navigation bar, document headers, and metadata to look like a neutral personal utility ("Daily Notes & Task Checklist") with a notepad icon.
  * **Inactivity Auto-Lock**: Automatically purges in-memory encryption keys after 1, 5, or 15 minutes of inactivity (default: 5 min).
  * **Instant Quick Exit**: Pressing `Escape` twice rapidly or clicking the high-visibility "Quick Exit" button immediately unloads the encryption key from RAM and redirects the browser window to a benign destination (`https://mausam.imd.gov.in` or Wikipedia), overwriting the browser history entry.
  * **Multi-Tab Synchronization**: When locked in one browser tab, a broadcast message via `BroadcastChannel` instantly locks all concurrent open tabs of Pratikar.
* **Honest Limitations**:
  * If the attacker observes the screen while the victim is actively using the unlocked app in plain view, software cannot prevent visual surveillance. The victim is advised to use a private window and ensure physical privacy.
  * Browser history or PWA home-screen app icon might still be visible unless run in an incognito window or disguised.

---

### 2.2 Adversary 2: The Hardware / Forensic Extractor
* **Profile**: An adversary who acquires physical custody of the powered-off or locked device (e.g., untrusted third-party repair shop, bad actor stealing the phone) and extracts raw disk storage.
* **Objective**: Read IndexedDB records, obtain victim names, view perpetrator usernames, or inspect case files.
* **Defences**:
  * **AES-256-GCM Authenticated Encryption**: Every case, link, report, evidence entry, and audit log in IndexedDB is encrypted with an individual 12-byte initialization vector (IV) and a 256-bit AES key.
  * **600,000 PBKDF2 Iterations**: The encryption key is derived from the user's passphrase using PBKDF2-HMAC-SHA256 with 600,000 rounds and a 16-byte random salt. This makes offline dictionary and brute-force attacks computationally expensive on consumer hardware.
  * **Progressive Delay & Data Wipe**: After 5 failed unlock attempts, client-side unlock enforces exponential progressive delays (5s, 10s, 20s, up to 30s) and offers a one-click complete database wipe.
* **Honest Limitations**:
  * Client-side progressive delay only binds the browser UI. A forensic attacker who clones the raw IndexedDB data can run offline GPU cluster cracking against PBKDF2. If the user chose an extremely weak passphrase (e.g. `12345678`), offline cracking may succeed. Users are strongly urged to choose a 4-word random passphrase with high entropy.

---

### 2.3 Adversary 3: The Network Observer
* **Profile**: An ISP, public Wi-Fi operator, rogue cellular base station, or local router eavesdropper.
* **Objective**: Intercept evidence submissions, inspect case details, or log victim IP traffic.
* **Defences**:
  * **Zero Runtime HTTP/WebSocket Requests**: Once the static PWA bundle is cached, Pratikar issues **zero runtime network requests** of any kind.
  * **Strict Content Security Policy (CSP)**:
    ```http
    default-src 'self';
    connect-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline';
    font-src 'self' data:;
    img-src 'self' data:;
    frame-ancestors 'none';
    form-action 'self';
    ```
    Any attempt to execute an outbound `fetch()`, `XMLHttpRequest`, or `WebSocket` call is blocked and terminated by the browser engine.
  * **Self-Hosted Assets**: All typography (Noto Sans & Noto Sans Devanagari) is bundled as local `@fontsource-variable` WOFF2 files. No Google Fonts or external CDNs are contacted.
* **Honest Limitations**:
  * The initial download of the static website from the hosting provider is visible to network observers (domain name visible via SNI / DNS unless using Encrypted Client Hello / DoH).
  * If the user clicks an external link (e.g. `cybercrime.gov.in` or an intermediary grievance portal), the navigation request is handled by the browser directly and is visible to the ISP.

---

### 2.4 Adversary 4: The Hostile Platform / Intermediary Operator
* **Profile**: A digital platform or website that resists takedown notices or attempts to discover victim litigation strategies.
* **Objective**: Discredit complaints, alter timestamps, or avoid statutory liability under Rule 3(2)(b) of the IT Rules 2021.
* **Defences**:
  * **Deterministic Statutory Templates**: Formal complaints directly cite Section 79 safe-harbour forfeiture conditions and Rule 3(2)(b) of the IT Rules 2021 alongside the MeitY 11 Nov 2025 SOP, eliminating ambiguous wording.
  * **Cryptographic Tamper-Evident Hash Chain**: Each evidence log entry computes:
    $$\text{Hash}_n = \text{SHA-256}(\text{Seq} \parallel \text{Timestamp} \parallel \text{Type} \parallel \text{FieldsJSON} \parallel \text{Hash}_{n-1})$$
    Modifying or inserting past entries breaks cryptographic verification.
  * **Punycode & Homoglyph URL Detection**: Strips deceptive Cyrillic/Greek look-alike characters and validates URL domains before logging links.
* **Honest Limitations**:
  * The hash chain proves *tamper-evidence* (internal consistency since entry creation), not *statutory proof of third-party reality*. It is not a digital signature certified by a licensed Certifying Authority under Section 65B of the Indian Evidence Act (now Section 63 of Bharatiya Sakshya Adhiniyam, 2023).

---

### 2.5 Adversary 5: The Coercive Blackmailer (Extortionist)
* **Profile**: A criminal demanding immediate payment (UPI, gift cards, crypto) or additional intimate media under threat of exposure.
* **Objective**: Induce panic, force compliance, and manipulate the victim into destroying evidence.
* **Defences**:
  * **Trauma-Informed Calm Guidance**: Clear, step-by-step guidance reminding the victim: *"Do NOT pay money. Do NOT send more images. Do NOT delete chats or message logs."*
  * **Evidence Preservation Checklist**: Guides the victim on capturing factual message logs, sender usernames, phone numbers, and transaction IDs before the perpetrator deletes them.
  * **Automated 24-Hour Statutory Timers & .ICS Reminders**: Replaces panic with a concrete, actionable statutory countdown and calendar alerts for police escalation.
* **Honest Limitations**:
  * Software cannot prevent an offender from transmitting media that is already in their physical possession. Pratikar empowers swift legal disabling and evidence documentation.

---

## 3. Summary Threat Matrix

| Threat | Risk Level | Mitigated By | Remaining Residual Risk |
| :--- | :--- | :--- | :--- |
| **Intimate Partner Checking Phone** | High | Auto-lock, Disguise Mode, Double-Escape Quick Exit | Visual shoulder-surfing during active use |
| **Forensic Storage Extraction** | High | PBKDF2 (600,000 rounds) + AES-256-GCM | Weak user-chosen passphrases |
| **Network Eavesdropping / Traffic Analysis** | Medium | Static PWA, `connect-src 'self'`, No CDN/Telemetry | External link clicks go to external sites |
| **Intimate Media Leakage via App** | Critical | Absolute Zero Media Upload / In-Memory Hashing | None (app never receives or stores files) |
| **Evidence Tampering Disputes** | Medium | SHA-256 Hash Chain Ledger | Requires supporting device testimony in court |
