# Configuration & Legal Data Maintenance Guide

**Project:** Pratikar (प्रतिकार)  
**Location of Config Files:** `src/data/`  
**Location of JSON Schemas:** `src/data/schemas/`  
**Validation Utility:** `scripts/validate-config.js`  

---

## 1. Overview of Data Configuration Files

To guarantee absolute factual accuracy, prevent hallucinated URLs or phone numbers, and ensure trilingual completeness across English, Hindi, and Marathi, all statutory rules, platforms, and emergency channels are governed by strict JSON files:

1. `src/data/rules.json`: Statutory citations, legal bases, timeframes, and escalation ladder.
2. `src/data/channels.json`: National helplines, police emergency portals, and support organizations.
3. `src/data/platforms.json`: Common social media platforms, reporting page URLs, link-finding instructions, and grievance officer notes.
4. `src/data/plan-steps.json`: The 8 personalized action steps guiding the redress sequence.

---

## 2. Schema Specifications & Integrity Rules

Every configuration file must validate against its JSON Schema definition in `src/data/schemas/` using Draft-07 syntax. The pre-build script automatically halts compilation if any property is missing, unverified without a badge, or missing translations.

### 2.1 Verification Rule
* Every platform and emergency channel entry contains:
  * `"verified"`: boolean (`true` if confirmed against official gazette / platform grievance page; `false` otherwise).
  * `"lastVerified"`: ISO 8601 Date string (e.g., `"2026-10-29"`).
* **RULE:** If an entry has `"verified": false`, the UI automatically renders a visible `"Please verify before use"` badge next to the entry. Never mark an entry as verified unless independently checked against official source documentation.

### 2.2 Trilingual Requirement
* Every human-readable string (name, description, tips, grievance notes) must provide complete localized text across all three supported languages:
  ```json
  {
    "en": "English description...",
    "hi": "हिन्दी विवरण...",
    "mr": "मराठी माहिती..."
  }
  ```

---

## 3. Adding or Updating a Platform (`platforms.json`)

To add a new platform or update an existing platform's grievance details:

1. Open `src/data/platforms.json`.
2. Ensure the entry structure matches `src/data/schemas/platforms.schema.json`:
   ```json
   {
     "id": "newplatform",
     "displayName": "NewPlatform",
     "reportingPageUrl": "https://www.newplatform.example/report-ncii",
     "howToFindLink": {
       "en": "Tap the three dots (...) on the post and select 'Copy Link'.",
       "hi": "पोस्ट पर तीन डॉट्स (...) पर टैप करें और 'लिंक कॉपी करें' चुनें।",
       "mr": "पोस्टवरील तीन ठिपक्यांवर (...) टॅप करा आणि 'लिंक कॉपी करा' निवडा."
     },
     "grievanceOfficerNote": {
       "en": "Submit via the online web form or email the designated Resident Grievance Officer.",
       "hi": "ऑनलाइन फॉर्म या नामित स्थानीय शिकायत अधिकारी को ईमेल भेजें।",
       "mr": "ऑनलाइन फॉर्मद्वारे किंवा नियुक्त तक्रार निवारण अधिकाऱ्याला ईमेल पाठवा."
     },
     "verified": true,
     "lastVerified": "2026-10-29"
   }
   ```
3. Run the validation command:
   ```bash
   node scripts/validate-config.js
   ```

---

## 4. Updating Emergency Helplines (`channels.json`)

1. Open `src/data/channels.json`.
2. Channel numbers and URLs must belong to verified national authorities:
   * `1930`: National Cybercrime Helpline
   * `112`: National Emergency Response Support System (ERSS)
   * `181`: Women's Helpline (Domestic Abuse & Crisis)
   * `1098`: Childline (Emergency Child Protection)
   * `https://cybercrime.gov.in`: National Cybercrime Reporting Portal
3. Update `"lastVerified"` to the current date once confirmed.

---

## 5. Running Automated Validation

The repository includes a validation script (`scripts/validate-config.js`) that runs during `npm run build` and can be invoked manually:

```bash
# Run schema and trilingual completeness checks:
node scripts/validate-config.js
```

### Expected Output:
```text
--- Validating Data Configuration Files ---
✅ Schema valid: rules.json
✅ Localization complete (en, hi, mr): rules.json
✅ Schema valid: channels.json
✅ Localization complete (en, hi, mr): channels.json
✅ Schema valid: platforms.json
✅ Localization complete (en, hi, mr): platforms.json
✅ Schema valid: plan-steps.json
✅ Localization complete (en, hi, mr): plan-steps.json

All data configuration files are valid and fully translated.
```
If any field is missing or contains untranslated keys, the script exits with status code 1 and specifies the exact JSON path of the violation.
