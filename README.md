# Pratikar (प्रतिकार)

> **Privacy-first, offline-capable Progressive Web App (PWA) empowering victims of non-consensual intimate imagery (NCII), sextortion, and deepfakes to enforce India's 24-hour statutory takedown rule and maintain tamper-evident chronological proof.**

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](https://opensource.org/licenses/MIT)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict_Mode-blue.svg)](https://www.typescriptlang.org/)
[![Offline: 100% PWA](https://img.shields.io/badge/PWA-Offline_First-green.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![WCAG: 2.1_AA](https://img.shields.io/badge/Accessibility-WCAG_2.1_AA-purple.svg)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Zero Cloud](https://img.shields.io/badge/Network-Zero_Cloud_Requests-emerald.svg)](docs/PRIVACY.md)

---

## 📖 Problem Statement & Who It Is For

Intimate-image abuse, sextortion, and AI-morphed deepfakes cause acute psychological distress, panic, and isolation. In India:
* Many victims are young adults on budget Android phones, often sharing devices with family or roommates.
* Many read Marathi (मराठी) or Hindi (हिन्दी) more comfortably than English.
* Perpetrators use coercive time-pressure (demanding money or more imagery within hours) to force compliance.
* Many victims do not know that under **Rule 3(2)(b) of India's IT Rules 2021**, online platforms are legally required to remove non-consensual intimate imagery within **24 hours** of a complaint.

**Pratikar is designed for:**
1. A frightened individual navigating digital extortion who needs their first actionable step in under 30 seconds.
2. A supportive friend, family member, advocate, or college volunteer helping someone through a crisis in "Assisted Mode".
3. Anyone whose phone may be checked or monitored by an abusive partner or family member.

---

## ⚖️ Legal & Regulatory Basis

Pratikar strictly references verified statutory provisions and standard operating procedures published by the Government of India:

1. **Rule 3(2)(b) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021**:
   - Mandates that intermediaries must remove or disable access to reported intimate, nude, sexual, or morphed/deepfake content **within 24 hours** of receiving a complaint from the affected individual or someone on their behalf.
2. **Ministry of Electronics and Information Technology (MeitY) Standard Operating Procedure (SOP) on NCII (Issued 11 November 2025)**:
   - Official procedural guidelines establishing roles, timelines, and inter-agency workflows across complainants, intermediaries, cyber cells, and the Grievance Appellate Committee (GAC).
   - [Official MeitY Document Reference (PDF)](https://www.meity.gov.in/static/uploads/2025/11/a2c9500ef5f8b62a43bfc68747de592d.pdf)
3. **National Support Channels**:
   - National Cybercrime Helpline: **1930**
   - National Cybercrime Reporting Portal: **cybercrime.gov.in**
   - National Emergency Service: **112**
   - Women's Helpline: **181**
   - Childline: **1098** (Mandatory for persons under 18)

---

## 🛡️ What Pratikar Is and Is NOT

| What Pratikar IS | What Pratikar IS NOT |
| :--- | :--- |
| ✅ A calm, trauma-informed step-by-step guidance tool | ❌ **NOT legal advice** and does not act as legal counsel |
| ✅ Generates ready-to-send 24-hour statutory takedown complaints | ❌ **Does NOT remove content** from platforms itself |
| ✅ Cryptographic SHA-256 hash chain evidence logger entirely on device | ❌ **Evidence log is tamper-evident, NOT tamper-proof** or an official court certificate |
| ✅ Clean printable case summary generator for Police / NCRP | ❌ **Does NOT identify offenders** or track IP addresses |
| ✅ 100% offline, zero-backend, encrypted on device | ❌ **NOT connected** to any government, police, or tech database |

---

## 🔒 Absolute Privacy & Security Architecture

1. **Zero Remote Requests**:
   - No backend, no API server, no accounts, no database server, no cookies, no third-party scripts, no analytics, no telemetry.
   - Enforced by Content Security Policy (`connect-src 'self'`).
2. **Absolute Zero Intimate Media Storage Policy**:
   - The application strictly refuses to receive, process, or store intimate photos or videos.
   - Evidence records consist of web URLs, usernames, phone numbers, timestamps, and cryptographic SHA-256 hashes.
   - In-memory file hashing reads files into ephemeral RAM buffers, computes the SHA-256 digital fingerprint via Web Crypto API, and immediately discards the file.
3. **Hardware-Isolated Encrypted Vault**:
   - All sensitive data is encrypted using **AES-256-GCM** with a 12-byte IV per write operation.
   - Master keys are derived via **PBKDF2-HMAC-SHA256 with 600,000 iterations** and a 16-byte random salt.
   - Memory keys are purged on tab lock, timeout, or Quick Exit.
4. **Safety & Camouflage Controls**:
   - **Quick Exit (Panic Mode)**: Pressing `Esc` twice rapidly or clicking "Quick Exit" immediately purges keys and redirects to the Indian Meteorological Department weather forecast (`https://mausam.imd.gov.in`).
   - **Disguise Mode**: Single-toggle transforms header, title, and icons into "Daily Notes & Task Checklist".
   - **Multi-Tab Synchronization**: Locking in one tab immediately locks all open tabs via `BroadcastChannel`.
5. **Minor Protection Safeguard (POCSO)**:
   - If the affected person is under 18, normal self-service flows are halted immediately, presenting direct routes to Childline 1098 and NCRP POCSO reporting without saving any data.

---

## 💻 Tech Stack & Decisions

| Technology | Role | Justification |
| :--- | :--- | :--- |
| **Vite + React 18** | UI Framework & Bundler | Ultra-fast build times, zero runtime overhead, component modularity. |
| **TypeScript (Strict)** | Language | `noUncheckedIndexedAccess: true` prevents undefined index errors and ensures data model integrity. |
| **React Router (HashRouter)** | Routing | Enables seamless client-side navigation on any static host (GitHub Pages, Vercel, Netlify) without server rewrite rules. |
| **Tailwind CSS** | Styling | Purged zero-runtime CSS tokens supporting calm trauma-informed palettes, high contrast, and text scaling. |
| **idb (IndexedDB)** | Storage | Ultra-lightweight (~1.2KB) promise-based native database for encrypted offline persistence. |
| **Web Crypto API** | Cryptography | Native browser cryptographic engine (PBKDF2 with 600,000 iterations, AES-GCM, SHA-256) without third-party dependencies. |
| **vite-plugin-pwa (Workbox)** | PWA / Offline | Full offline asset precaching for reliable operation in flight mode or on unstable connections. |
| **@fontsource-variable** | Fonts | Self-hosted variable WOFF2 fonts (`Noto Sans` & `Noto Sans Devanagari`); zero Google Fonts CDN requests. |
| **Vitest & Playwright** | Testing | 47 unit and integration tests passing; Playwright E2E and `@axe-core/playwright` accessibility audits. |

---

## 🕵️ How to Verify Zero Network Requests

Anyone can independently verify that Pratikar never sends data across the network:

1. **Browser DevTools Network Inspection**:
   - Open Chrome DevTools (`F12` or `Ctrl+Shift+I`) and switch to the **Network** tab.
   - Check the **Preserve log** checkbox.
   - Perform an entire walkthrough: create a vault, create a case, add links, record evidence, generate complaints.
   - **Result**: You will observe exactly **zero** outbound fetch, XHR, WebSocket, or beacon calls.
2. **Simulate Offline / Airplane Mode**:
   - Enable Airplane Mode or set Network Throttling to **Offline**.
   - Navigate through every screen, create cases, hash files, and generate documents.
   - **Result**: The application functions with 100% completeness because all logic and assets are local.
3. **Inspect Content Security Policy (CSP)**:
   - Inspect the `<meta http-equiv="Content-Security-Policy">` tag in `index.html` and the `_headers` / `vercel.json` files:
   - `connect-src 'self'` restricts all fetch/WebSocket traffic to the app's own origin, blocking all third-party endpoints.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ (tested on Node v20.x and v24.x)
- npm v9+

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/your-username/pratikar.git
cd pratikar

# Install pinned dependencies
npm install

# Validate configuration schemas & check i18n key consistency
node scripts/validate-config.js
node scripts/check-i18n.js

# Start development server
npm run dev
```

### Verification & Testing
```bash
# Run unit & component tests (Vitest)
npm run test

# Type-check TypeScript in strict mode
npm run type-check

# Run ESLint with accessibility & security plugins
npm run lint

# Production build (validates configs + typechecks + builds static PWA)
npm run build

# Run Playwright E2E and Axe accessibility audits
npx playwright test --project=chromium
```

---

## 🌐 Free-Tier Static Hosting & Deployment

Pratikar is designed for free-tier static hosting with zero servers required:

* **Vercel**: Pre-configured with `vercel.json` (security headers, caching, CSP).
* **Netlify / Cloudflare Pages**: Pre-configured with `_headers` (X-Frame-Options, CSP, Permissions-Policy).
* **GitHub Pages**: Build output in `/dist` can be deployed directly to `gh-pages` branch.

---

## 📚 Documentation Reference

- [Privacy Architecture (docs/PRIVACY.md)](docs/PRIVACY.md)
- [Threat Model & Adversary Analysis (docs/THREAT_MODEL.md)](docs/THREAT_MODEL.md)
- [Accessibility VPAT Self-Assessment (docs/ACCESSIBILITY.md)](docs/ACCESSIBILITY.md)
- [Translation & Trauma-Informed Linguistic Review (docs/TRANSLATION_REVIEW.md)](docs/TRANSLATION_REVIEW.md)
- [Configuration & Schema Maintenance Guide (docs/CONFIG_GUIDE.md)](docs/CONFIG_GUIDE.md)
- [Technical & Legal Limitations (docs/LIMITATIONS.md)](docs/LIMITATIONS.md)
- [Changelog (CHANGELOG.md)](CHANGELOG.md)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
