export interface PassphraseStrength {
  score: number; // 0 to 4
  level: 'weak' | 'fair' | 'good' | 'strong';
  feedbackKey: string;
  isFourWords: boolean;
}

/**
 * Lightweight passphrase strength heuristic without external dependencies.
 * Evaluates length, character set diversity, and the recommended 4-word passphrase pattern.
 */
export function evaluatePassphraseStrength(passphrase: string): PassphraseStrength {
  const trimmed = passphrase.trim();
  if (trimmed.length === 0) {
    return { score: 0, level: 'weak', feedbackKey: 'passphrase.tooShort', isFourWords: false };
  }

  // Count distinct words separated by spaces, dashes, or underscores
  const words = trimmed.split(/[\s\-_]+/).filter((w) => w.length >= 2);
  const isFourWords = words.length >= 4;

  let score = 0;

  if (trimmed.length >= 8) score += 1;
  if (trimmed.length >= 12) score += 1;
  if (trimmed.length >= 16 || isFourWords) score += 1;

  // Character variety check
  const hasLower = /[a-z]/.test(trimmed);
  const hasUpper = /[A-Z]/.test(trimmed);
  const hasDigit = /[0-9]/.test(trimmed);
  const hasSpecial = /[^a-zA-Z0-9\s]/.test(trimmed);
  const varietyCount = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

  if (varietyCount >= 3 || isFourWords) {
    score += 1;
  }

  // Clamp score between 0 and 4
  score = Math.min(4, Math.max(trimmed.length < 8 ? 1 : 2, score));

  let level: PassphraseStrength['level'] = 'weak';
  if (score === 2) level = 'fair';
  else if (score === 3) level = 'good';
  else if (score >= 4) level = 'strong';

  let feedbackKey = 'passphrase.fair';
  if (isFourWords) {
    feedbackKey = 'passphrase.fourWords';
  } else if (level === 'strong') {
    feedbackKey = 'passphrase.strong';
  } else if (level === 'weak') {
    feedbackKey = 'passphrase.weak';
  }

  return {
    score,
    level,
    feedbackKey,
    isFourWords,
  };
}
