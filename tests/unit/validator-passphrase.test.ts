import { describe, it, expect } from 'vitest';
import { validateUrl, parseAndValidateUrlList } from '../../src/lib/urlValidator';
import { evaluatePassphraseStrength } from '../../src/lib/passphrase';

describe('URL Validator and Homoglyph Detection', () => {
  it('validates standard https URLs cleanly', () => {
    const res = validateUrl('https://instagram.com/p/test-post-123');
    expect(res.isValid).toBe(true);
    expect(res.hostname).toBe('instagram.com');
    expect(res.isLookalike).toBe(false);
  });

  it('automatically adds https when scheme is omitted', () => {
    const res = validateUrl('facebook.com/fake-profile');
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe('https://facebook.com/fake-profile');
  });

  it('rejects unsafe schemes like javascript: and data:', () => {
    const jsRes = validateUrl('javascript:alert(1)');
    expect(jsRes.isValid).toBe(false);

    const dataRes = validateUrl('data:text/html,<script>alert(1)</script>');
    expect(dataRes.isValid).toBe(false);
  });

  it('detects mixed-script lookalike homoglyphs', () => {
    // Mixed Latin and Cyrillic 'а' (U+0430)
    const homoglyphUrl = 'https://instаgram.com/profile';
    const res = validateUrl(homoglyphUrl);
    expect(res.isValid).toBe(true);
    expect(res.isLookalike).toBe(true);
    expect(res.lookalikeWarning).toContain('look-alike domain');
  });

  it('parses, trims, and de-duplicates multiline URL lists', () => {
    const input = `
      https://instagram.com/post/1
      https://instagram.com/post/2
      https://instagram.com/post/1
      x.com/thread/100
    `;
    const results = parseAndValidateUrlList(input);
    expect(results).toHaveLength(3);
    expect(results[0]?.normalized).toBe('https://instagram.com/post/1');
    expect(results[1]?.normalized).toBe('https://instagram.com/post/2');
    expect(results[2]?.normalized).toBe('https://x.com/thread/100');
  });
});

describe('Passphrase Strength Evaluator', () => {
  it('identifies short weak passphrases', () => {
    const res = evaluatePassphraseStrength('abc');
    expect(res.level).toBe('weak');
    expect(res.isFourWords).toBe(false);
  });

  it('identifies 4-word passphrases as strong', () => {
    const res = evaluatePassphraseStrength('river temple blue shadow');
    expect(res.isFourWords).toBe(true);
    expect(res.score).toBeGreaterThanOrEqual(3);
    expect(res.feedbackKey).toBe('passphrase.fourWords');
  });
});
