import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const ajv = new Ajv({ allErrors: true });

const filesToValidate = [
  {
    dataPath: path.join(rootDir, 'src/data/rules.json'),
    schemaPath: path.join(rootDir, 'src/data/schemas/rules.schema.json'),
    name: 'rules.json',
  },
  {
    dataPath: path.join(rootDir, 'src/data/channels.json'),
    schemaPath: path.join(rootDir, 'src/data/schemas/channels.schema.json'),
    name: 'channels.json',
  },
  {
    dataPath: path.join(rootDir, 'src/data/platforms.json'),
    schemaPath: path.join(rootDir, 'src/data/schemas/platforms.schema.json'),
    name: 'platforms.json',
  },
  {
    dataPath: path.join(rootDir, 'src/data/plan-steps.json'),
    schemaPath: path.join(rootDir, 'src/data/schemas/plan-steps.schema.json'),
    name: 'plan-steps.json',
  },
];

const requiredLocales = ['en', 'hi', 'mr'];

function checkLocalizedStrings(obj, filePath, pathPrefix = '') {
  let errors = [];
  if (obj === null || typeof obj !== 'object') {
    return errors;
  }

  // Check if this object looks like a localized text bundle (has en, hi, or mr)
  const keys = Object.keys(obj);
  const hasLocaleKey = keys.some((k) => requiredLocales.includes(k));

  if (hasLocaleKey) {
    for (const loc of requiredLocales) {
      if (!obj[loc] || typeof obj[loc] !== 'string' || obj[loc].trim() === '') {
        errors.push(`${filePath} at ${pathPrefix}: missing or empty translation for '${loc}'`);
      }
    }
  }

  // Recursively inspect children
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object') {
      errors = errors.concat(checkLocalizedStrings(value, filePath, pathPrefix ? `${pathPrefix}.${key}` : key));
    }
  }

  return errors;
}

let totalErrors = 0;

console.log('--- Validating Data Configuration Files ---');

for (const item of filesToValidate) {
  try {
    const rawData = fs.readFileSync(item.dataPath, 'utf8');
    const data = JSON.parse(rawData);

    const rawSchema = fs.readFileSync(item.schemaPath, 'utf8');
    const schema = JSON.parse(rawSchema);

    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
      console.error(`❌ Schema validation failed for ${item.name}:`);
      console.error(validate.errors);
      totalErrors++;
    } else {
      console.log(`✅ Schema valid: ${item.name}`);
    }

    // Check localized strings
    const locErrors = checkLocalizedStrings(data, item.name);
    if (locErrors.length > 0) {
      console.error(`❌ Localization errors in ${item.name}:`);
      locErrors.forEach((e) => console.error(`   - ${e}`));
      totalErrors += locErrors.length;
    } else {
      console.log(`✅ Localization complete (en, hi, mr): ${item.name}`);
    }
  } catch (err) {
    console.error(`❌ Error reading or parsing ${item.name}:`, err.message);
    totalErrors++;
  }
}

if (totalErrors > 0) {
  console.error(`\nValidation failed with ${totalErrors} error(s).`);
  process.exit(1);
} else {
  console.log('\nAll data configuration files are valid and fully translated.');
  process.exit(0);
}

