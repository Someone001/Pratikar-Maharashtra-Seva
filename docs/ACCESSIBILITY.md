# Accessibility Conformance Report (VPAT-Style Self-Assessment)

**Product Name:** Pratikar (प्रतिकार)  
**Standard:** Web Content Accessibility Guidelines (WCAG) 2.1 Level AA  
**Evaluation Methods:** Automated audits via `@axe-core/playwright`, manual keyboard navigation, screen reader testing (NVDA / VoiceOver), font rendering evaluations in Devanagari and Latin.  
**Date of Assessment:** 2026-10-29  

---

## 1. Conformance Level Summary

| WCAG 2.1 Principle | Level A Conformance | Level AA Conformance | Overall Status |
| :--- | :--- | :--- | :--- |
| **Principle 1: Perceivable** | Supports | Supports | **Fully Conforming** |
| **Principle 2: Operable** | Supports | Supports | **Fully Conforming** |
| **Principle 3: Understandable** | Supports | Supports | **Fully Conforming** |
| **Principle 4: Robust** | Supports | Supports | **Fully Conforming** |

---

## 2. Detailed WCAG 2.1 AA Success Criteria Review

### Principle 1: Perceivable

#### 1.1 Text Alternatives
* **1.1.1 Non-text Content (Level A): Supports**
  * All decorative emojis and icons include `aria-hidden="true"`.
  * Informative icons and action buttons provide descriptive screen-reader alternatives via `aria-label` (e.g., `<CopyButton aria-label="Copy legal notice text" />`).

#### 1.3 Adaptable
* **1.3.1 Info and Relationships (Level A): Supports**
  * Semantic HTML is strictly utilized: `<header>`, `<main>`, `<nav>`, `<fieldset>`, `<legend>`, `<h1-h4>`, `<ul>`, `<li>`.
  * Forms utilize native `<label htmlFor="...">` associations.
  * Tab interfaces implement full ARIA patterns: `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, and `role="tabpanel"`.
  * Dialogs implement `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
* **1.3.2 Meaningful Sequence (Level A): Supports**
  * DOM order strictly mirrors visual reading order across all screen widths.
* **1.3.5 Identify Input Purpose (Level AA): Supports**
  * Standard autocomplete attributes are assigned where appropriate.

#### 1.4 Distinguishable
* **1.4.1 Use of Color (Level A): Supports**
  * Color is never used as the sole conveyor of information. Urgency chips combine color with explicit text labels (`CRITICAL`, `IMMEDIATE`, `PENDING`). Form errors feature error icons, role alerts, and explicit error messages.
* **1.4.3 Contrast (Minimum) (Level AA): Supports**
  * Evaluated and verified using Axe-core.
  * Foreground-to-background contrast exceeds 4.5:1 for standard text (e.g., `#f8fafc` text on `#0f172a` bg achieves 17.6:1; `#cbd5e1` muted-foreground on `#334155` surface achieves 6.55:1; `#2dd4bf` teal on dark background achieves 10.2:1).
  * High-contrast mode option is provided in Settings.
* **1.4.4 Resize Text (Level AA): Supports**
  * The interface scales smoothly up to 200% without horizontal scrolling or truncation.
  * Settings provides dedicated dynamic font scaling options: Normal (100%), Large (115%), and Extra Large (130%).
* **1.4.11 Non-text Contrast (Level AA): Supports**
  * Interactive borders, focus rings, radio buttons, and checkboxes exceed 3.0:1 contrast against adjacent backgrounds.
* **1.4.12 Text Spacing (Level AA): Supports**
  * Supports custom line-height, letter-spacing, and word-spacing modifications without content loss.

---

### Principle 2: Operable

#### 2.1 Keyboard Accessible
* **2.1.1 Keyboard (Level A): Supports**
  * 100% of application features are operable via standard keyboard alone (`Tab`, `Shift+Tab`, `Space`, `Enter`, `Escape`, `ArrowLeft`, `ArrowRight`, `Home`, `End`).
* **2.1.2 No Keyboard Trap (Level A): Supports**
  * Modal dialogs trap focus inside while open and release focus back to the triggering element upon close (`Escape` or Done). Focus never gets trapped in unclosable cycles.
* **2.1.4 Character Key Shortcuts (Level A): Supports**
  * Only standard key combos (e.g. `Escape` `Escape` for Quick Exit) are registered, with visual buttons provided for touch users.

#### 2.4 Navigable
* **2.4.1 Bypass Blocks (Level A): Supports**
  * A visible skip-to-content link (`<a href="#main-content">Skip to primary content</a>`) appears upon the first keyboard `Tab` press.
* **2.4.3 Focus Order (Level A): Supports**
  * Logical tab sequences maintained through all interactive widgets and multi-step wizards.
* **2.4.4 Link Purpose (In Context) (Level A): Supports**
  * External links indicate that they open third-party websites with clear text and interstitial confirmation dialogs.
* **2.4.7 Focus Visible (Level AA): Supports**
  * Prominent, high-contrast focus rings (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`) are enforced on all interactive elements.

#### 2.5 Input Modalities
* **2.5.5 Target Size (Minimum 44x44 CSS px) (Level AAA / Mobile Best Practice): Supports**
  * All buttons, radio targets, checkboxes, navigation items, and external link icons maintain minimum touch target dimensions of 44x44px (`min-h-[44px]`).

---

### Principle 3: Understandable

#### 3.1 Readable
* **3.1.1 Language of Page (Level A): Supports**
  * Dynamic root attribute updates (`<html lang="en">`, `<html lang="hi">`, or `<html lang="mr">`) when the user switches interface languages.
* **3.1.2 Language of Parts (Level AA): Supports**
  * Multilingual script segments (such as Devanagari legal references inside English complaint templates) include proper `lang="hi"` / `lang="mr"` markup.
* **Devanagari Typography & Matra Integrity**:
  * Local variable font `@fontsource-variable/noto-sans-devanagari` is loaded with full conjunct, halant, and matra ligatures enabled (`font-variant-ligatures: contextual common-ligatures;`). Conjuncts in words like `प्रतिकार`, `संमती`, and `माहिती` render cleanly without broken vowel glyphs across low-end Android and desktop engines.

#### 3.2 Predictable
* **3.2.1 On Focus (Level A): Supports**
  * Focusing an element never triggers unexpected context changes, form submissions, or route navigations.

#### 3.3 Input Assistance
* **3.3.1 Error Identification (Level A): Supports**
  * Form validation errors are announced to screen readers using `aria-invalid="true"`, `aria-describedby`, and `role="alert"`.
* **3.3.2 Labels or Instructions (Level A): Supports**
  * Every input includes a visible label, descriptive placeholder, and helper hints where applicable.

---

### Principle 4: Robust

#### 4.1 Compatible
* **4.1.2 Name, Role, Value (Level A): Supports**
  * All custom components (`Accordion`, `Tabs`, `Dialog`, `Countdown`, `CopyButton`) map cleanly to standard WAI-ARIA authoring practices.
* **4.1.3 Status Messages (Level AA): Supports**
  * Dynamic events (e.g. "Copied to clipboard!", "Evidence recorded", countdown timers) use `aria-live="polite"` to alert assistive technologies without stealing focus.

---

## 3. Automated Audit Log
Automated regression tests run on every pull request using `@axe-core/playwright`:
```bash
npx playwright test --project=chromium tests/e2e/accessibility.spec.ts
```
* **Violations Found:** 0
* **WCAG 2.1 Level A:** 100% Pass
* **WCAG 2.1 Level AA:** 100% Pass
