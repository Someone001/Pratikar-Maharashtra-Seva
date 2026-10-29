# Pratikar (प्रतिकार)

> **Privacy-first, offline-capable Progressive Web App (PWA) empowering victims of non-consensual intimate imagery (NCII), sextortion, and deepfakes to enforce India's 24-hour statutory takedown rule and maintain tamper-evident chronological proof.**

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](https://opensource.org/licenses/MIT)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict_Mode-blue.svg)](https://www.typescriptlang.org/)
[![Offline: 100% PWA](https://img.shields.io/badge/PWA-Offline_First-green.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![WCAG: 2.1_AA](https://img.shields.io/badge/Accessibility-WCAG_2.1_AA-purple.svg)](https://www.w3.org/WAI/standards-guidelines/wcag/)

---

## ⚖️ Legal & Regulatory Basis

Pratikar strictly references verified statutory frameworks and standard operating procedures published by the Government of India:

1. **Rule 3(2)(b) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021**:
   - Mandates that any social media intermediary or online platform must remove or disable access to reported intimate, nude, sexually explicit, or artificially morphed/deepfake content **within 24 hours** of receiving a complaint from the affected individual or someone on their behalf.
2. **Ministry of Electronics and Information Technology (MeitY) Standard Operating Procedure (SOP) on NCII (Issued 11 November 2025)**:
   - Official procedural guidelines establishing roles, timelines, and inter-agency workflows across complainants, intermediaries, cyber cells, and the Grievance Appellate Committee (GAC).
   - [Official MeitY Document Reference](https://www.meity.gov.in/static/uploads/2025/11/a2c9500ef5f8b62a43bfc68747de592d.pdf)
3. **National Support Channels**:
   - Cybercrime Helpline: **1930**
   - National Cybercrime Reporting Portal (NCRP): **cybercrime.gov.in**
   - National Emergency Service: **112**
   - Women's Helpline: **181**
   - Childline: **1098** (Mandatory for persons under 18)

---

## 🛡️ What Pratikar Is and Is NOT

| What Pratikar IS | What Pratikar IS NOT |
| :--- | :--- |
| ✅ A structured, trauma-informed guidance tool | ❌ **NOT legal advice** and does not act as legal counsel |
| ✅ Generates legally-grounded 24-hour takedown notices | ❌ **Does NOT remove content** from platforms itself |
| ✅ Client-side SHA-256 hash chain evidence logger | ❌ **Evidence log is tamper-evident, NOT tamper-proof** or a court certificate |
| ✅ Clean printable summary generator for Police / NCRP | ❌ **Does NOT identify offenders** or track IP addresses |
| ✅ 100% offline, zero-backend, encrypted on device | ❌ **NOT connected** to any government, police, or tech database |

---

## 🔒 Absolute Privacy & Security Architecture

1. **Zero Remote Requests**:
   - The application does not contain a backend server, database, cookies, analytics, telemetry, or external font/script CDN calls.
   - All network calls are strictly restricted by Content Security Policy (`connect-src 'none'`).
2. **Zero Storage of Intimate Images**:
   - **The app strictly refuses to receive, process, or store intimate photos or videos.**
   - Evidence records consist of web URLs, usernames, phone numbers, timestamps, and cryptographic SHA-256 hashes.
   - An in-browser file hasher reads screenshots in client memory, calculates the SHA-256 digital fingerprint, and immediately purges the file from memory.
3. **Device-Level Cryptographic Vault**:
   - All sensitive data (cases, URLs, reports, evidence entries) are encrypted using **AES-256-GCM**.
   - Keys are derived via **PBKDF2-SHA256 (100,000 iterations)** using a user-selected passphrase.
   - Memory keys are purged on tab close, hide, or manual lock.
4. **Emergency Panic Button (Quick Exit)**:
   - Accessible from any screen via `Esc` key or the top-right button. Instantly purges active encryption keys and redirects the browser to a neutral website (e.g., Google or weather).
5. **Minor Protection Safeguard**:
   - If the affected person is under 18, normal self-service flows are halted immediately, presenting direct routes to Childline 1098 and NCRP POCSO reporting.

---

## 💻 Tech Stack & Justification

| Technology | Role | Justification |
| :--- | :--- | :--- |
| **Vite + React 18** | UI Framework & Bundler | Ultra-fast build times, zero runtime overhead, component modularity. |
| **TypeScript (Strict)** | Language | `noUncheckedIndexedAccess: true` prevents undefined index errors and ensures bulletproof data model integrity. |
| **React Router (HashRouter)** | Routing | Enables seamless client-side navigation on any static host (GitHub Pages, Vercel, Netlify) without server redirects. |
| **Tailwind CSS** | Styling | Purged zero-runtime CSS variables design tokens supporting calm trauma-informed palettes, high contrast, and text scaling. |
| **idb (IndexedDB)** | Storage | Ultra-lightweight (~1.2KB) promise-based native database for encrypted offline persistence. |
| **Web Crypto API** | Cryptography | Native browser cryptographic engine (PBKDF2, AES-GCM, SHA-256) without heavy or insecure third-party crypto libraries. |
| **vite-plugin-pwa (Workbox)** | PWA / Offline | Full offline asset precaching for reliable operation in flight mode or on unstable connections. |
| **@fontsource-variable** | Fonts | Self-hosted variable WOFF2 fonts (`Noto Sans` & `Noto Sans Devanagari`); zero Google Fonts CDN requests. |
| **Vitest & Playwright** | Testing | Fast unit and end-to-end testing with `@axe-core/playwright` accessibility audits. |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ (tested on v24.x)
- npm v9+

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/your-username/pratikar.git
cd pratikar

# Install pinned dependencies
npm install

# Validate configuration schemas & check i18n key consistency
npm run validate-config
npm run check-i18n

# Start development server
npm run dev
```

### Verification & Testing
```bash
# Run unit & component tests
npm run test

# Type-check TypeScript strict mode
npm run type-check

# Run ESLint with accessibility & security plugins
npm run lint

# Production build (validates configs + typechecks + builds static bundle)
npm run build
```
