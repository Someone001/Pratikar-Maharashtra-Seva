# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-29

### Added
- **Privacy-First Static Architecture**: Zero-backend, zero-telemetry, zero-cookie client-side Progressive Web Application (PWA).
- **Strict Content Security Policy (CSP)**: Enforced `connect-src 'self'`, `default-src 'self'`, with no external CDNs, fonts, or analytics.
- **Client-Side Cryptographic Vault**:
  - PBKDF2 key derivation upgraded to 600,000 iterations with 16-byte cryptographically secure random salt.
  - AES-256-GCM authenticated encryption for all case data, evidence records, links, and reports stored in IndexedDB (`pratikar_db_v1`).
  - Known-plaintext token verification for instant passphrase correctness validation in RAM.
  - Custom passphrase entropy evaluator with four-random-words recommendation.
  - Progressive rate-limiting delay on client-side unlock attempts (up to 30s) and typed `"DELETE"` confirmation wipe.
  - Inactivity auto-lock timer (1, 5, 15 minutes, or never) with multi-tab synchronization via `BroadcastChannel`.
- **Absolute Zero Intimate Media Storage Policy**:
  - Memory-only file hasher using browser Web Crypto SHA-256 (`crypto.subtle.digest`).
  - Immediate byte array cleanup from RAM; only metadata and hash are persisted.
  - Prominent banners and warnings against selecting intimate imagery.
- **Two-Step Safety Check & POCSO Age Gate**:
  - Question 1: Immediate physical safety check with direct `tel:112` link.
  * Question 2: Age verification. Minor (<18) branch immediately halts normal flow, showing Childline 1098, 112, NCRP POCSO wing, and saving no data.
- **Trilingual Localization (en, hi, mr)**:
  - English, Hindi (हिन्दी), and Marathi (मराठी) localization across 215 synchronized translation keys.
  - Persistent language selector in header and settings.
  - Self-hosted variable typography (`Noto Sans` and `Noto Sans Devanagari`) via local `@fontsource-variable` WOFF2 assets with full matra and conjunct support.
- **8-Step Guided Intake Wizard**:
  - Self vs. Assisted mode (consent confirmation and helper name).
  - Incident situation multi-select in plain words (sharing, threats/sextortion, morphed/deepfakes, fake profiles, harassment).
  - Multi-platform selector and custom platform input.
  - Multiline URL parser with Punycode conversion and Cyrillic/Greek homoglyph spoofing detector.
  - Coercion guidance: clear reminders not to pay extortionists and not to delete chat history.
  - Optional complainant identifiers with redaction flags for export.
  - Auto-saving intake draft in encrypted storage with resume functionality.
- **5-Tab Case Detail Workspace**:
  - **Plan**: 8-step personalized redress checklist based on Rule 3(2)(b) and MeitY SOP (11 Nov 2025).
  - **Reports**: Statutory 24-hour live countdown timer, outcome selector, reference ID logger, and `.ics` calendar reminder generator.
  - **Evidence**: Cryptographic SHA-256 hash chain ledger with in-browser file hasher and integrity verification badge.
  - **Documents**: 5 deterministic statutory legal templates with copy buttons and external link interstitials.
  - **Timeline**: Integrated chronological police timeline merging links, threats, reports, and evidence entries.
- **5 Deterministic Statutory Legal Templates**:
  - 1. Platform 24-Hour NCII Removal Request (citing Rule 3(2)(b), IT Rules 2021 and MeitY SOP 11 Nov 2025).
  - 2. Grievance Officer Missed-Deadline Follow-Up / Escalation Notice (citing Section 79 safe harbour forfeiture).
  - 3. National Cybercrime Reporting Portal (NCRP) / 1930 Helpline Preparation Sheet.
  - 4. Police Station FIR / Written Complaint Summary with personal detail redaction toggle.
  - 5. Evidence Preservation Request with Draft Lawyer / Advocate Statement.
  - All templates include the mandatory non-legal-advice footer: *"Prepared with Pratikar, an information and organisation tool. This is not legal advice."*
- **Emergency Resources & Helplines**:
  - Searchable national helpline directory with direct `tel:` dialing, copy buttons, and last verified dates.
  - 4 plain-language explainers on sextortion, the 24-hour rule, link finding, and confiding in trusted persons.
  - 3-stage escalation ladder (Platform Grievance -> Grievance Appellate Committee -> Police / NCRP).
- **Disguise / Camouflage Mode & Safety Controls**:
  - Single-click camouflage mode transforming title, header, and icon to "Daily Notes & Task Checklist".
  - Double-Escape (`Esc` `Esc`) Quick Exit shortcut redirecting to Indian Meteorological Department weather forecast (`https://mausam.imd.gov.in`).
  - Customizable Quick Exit destination.
  - Encrypted backup export and import (JSON bundle).
  - Interactive Demo Mode populating sample case data for evaluation without risking personal information.
- **Accessibility & Compliance**:
  - WCAG 2.1 Level AA full conformance audited with `@axe-core/playwright` (zero violations).
  - High contrast ratio themes (minimum 4.5:1 for normal text, 3:1 for interactive controls).
  - Full keyboard accessibility with skip links, focus traps, and ARIA widgets.
  - Minimum 44x44px touch targets on mobile.
- **Automated Validation & Testing Suite**:
  - Pre-build schema and trilingual completeness validator (`scripts/validate-config.js`).
  - 47 Vitest unit and component tests passing.
  - Playwright E2E user journey and Axe accessibility tests passing.
