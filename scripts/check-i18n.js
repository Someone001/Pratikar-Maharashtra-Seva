import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.resolve(__dirname, '../src/locales');

const locales = ['en', 'hi', 'mr'];
const localeData = {};

for (const loc of locales) {
  const filePath = path.join(localesDir, `${loc}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing locale file: ${filePath}`);
    process.exit(1);
  }
  localeData[loc] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getDeepKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getDeepKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enKeys = new Set(getDeepKeys(localeData['en']));
let hasDiscrepancy = false;

for (const loc of ['hi', 'mr']) {
  const currentKeys = new Set(getDeepKeys(localeData[loc]));
  const missingInCurrent = [...enKeys].filter((k) => !currentKeys.has(k));
  const extraInCurrent = [...currentKeys].filter((k) => !enKeys.has(k));

  if (missingInCurrent.length > 0) {
    console.error(`❌ Locale '${loc}' is missing ${missingInCurrent.length} key(s):`);
    missingInCurrent.slice(0, 10).forEach((k) => console.error(`   - ${k}`));
    if (missingInCurrent.length > 10) console.error(`   ... and ${missingInCurrent.length - 10} more`);
    hasDiscrepancy = true;
  }

  if (extraInCurrent.length > 0) {
    console.warn(`⚠️ Locale '${loc}' has ${extraInCurrent.length} extra key(s) not in en:`);
    extraInCurrent.slice(0, 5).forEach((k) => console.warn(`   - ${k}`));
  }
}

if (hasDiscrepancy) {
  console.error('\nI18n check failed: missing translation keys.');
  process.exit(1);
} else {
  console.log(`\n✅ I18n check passed: all ${enKeys.size} keys present across en, hi, mr.`);
  process.exit(0);
}
