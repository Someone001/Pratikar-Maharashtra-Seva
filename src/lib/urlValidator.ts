export interface ValidatedUrlResult {
  raw: string;
  normalized: string;
  isValid: boolean;
  error?: string;
  hostname?: string;
  punycodeHostname?: string;
  isLookalike?: boolean;
  lookalikeWarning?: string;
}

// Common lookalike Cyrillic and Greek homoglyphs mimicking Latin letters
const HOMOGLYPH_REGEX = /[\u0400-\u04FF\u0370-\u03FF]/;
const LATIN_REGEX = /[a-zA-Z]/;

/**
 * Validates a single URL string, normalizes it, and checks for internationalized
 * domain look-alike / homoglyph phishing risks.
 */
export function validateUrl(rawUrl: string): ValidatedUrlResult {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      raw: rawUrl,
      normalized: '',
      isValid: false,
      error: 'URL cannot be empty.',
    };
  }

  // Strict check on scheme: only http and https allowed
  if (!/^https?:\/\//i.test(trimmed)) {
    // If user forgot scheme, test if adding https:// works
    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed)) {
      return validateUrl(`https://${trimmed}`);
    }
    return {
      raw: rawUrl,
      normalized: trimmed,
      isValid: false,
      error: 'Only HTTP and HTTPS web addresses are permitted.',
    };
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        raw: rawUrl,
        normalized: trimmed,
        isValid: false,
        error: 'Invalid protocol scheme. Only http: and https: are allowed.',
      };
    }

    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return {
        raw: rawUrl,
        normalized: trimmed,
        isValid: false,
        error: 'Incomplete or invalid domain name.',
      };
    }

    const punycodeHostname = parsed.hostname;
    const isPunycode = punycodeHostname.startsWith('xn--') || punycodeHostname.includes('.xn--');

    // Check for mixed-script homoglyphs in the raw hostname
    const rawHostname = trimmed.split('/')[2]?.split(':')[0] ?? '';
    const hasLatin = LATIN_REGEX.test(rawHostname);
    const hasHomoglyphScript = HOMOGLYPH_REGEX.test(rawHostname);

    let isLookalike = false;
    let lookalikeWarning: string | undefined;

    if (hasLatin && hasHomoglyphScript) {
      isLookalike = true;
      lookalikeWarning =
        'Potential look-alike domain: this address mixes Latin and Cyrillic/Greek characters which can visually impersonate genuine platforms.';
    } else if (isPunycode) {
      lookalikeWarning = `Internationalized domain name (Punycode: ${punycodeHostname}). Please verify this is the authentic platform.`;
    }

    return {
      raw: rawUrl,
      normalized: parsed.href,
      isValid: true,
      hostname: parsed.hostname,
      punycodeHostname,
      isLookalike,
      lookalikeWarning,
    };
  } catch {
    return {
      raw: rawUrl,
      normalized: trimmed,
      isValid: false,
      error: 'Malformed URL format.',
    };
  }
}

/**
 * Parses multiple URLs separated by newlines or commas, trims, de-duplicates,
 * and validates each link.
 */
export function parseAndValidateUrlList(inputText: string): ValidatedUrlResult[] {
  const lines = inputText
    .split(/[\r\n,]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const seen = new Set<string>();
  const results: ValidatedUrlResult[] = [];

  for (const line of lines) {
    const validated = validateUrl(line);
    const key = validated.isValid ? validated.normalized.toLowerCase() : validated.raw.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      results.push(validated);
    }
  }

  return results;
}
