export type EmissionsPresenceResult = {
  hasEmissionsMentions: boolean
  matchedTerms: string[]
}

/**
 * Cheap regex scan for GHG Protocol Scope 1/2/3 language in report markdown.
 *
 * Intent: an easy-win filter for reports that clearly mention scopes — not a
 * complete emissions detector. Prefer false positives over false negatives.
 * Image-only / OCR-missing disclosures are out of scope for this gate; those
 * can be re-run without the gate or backfilled manually.
 *
 * Matches common separators: space, hyphen, underscore (e.g. Scope-1, scope_2).
 */
const SCOPE_PATTERNS: { label: string; pattern: RegExp }[] = [
  // Explicit scope 1 / 2 / 3 with optional space, hyphen, or underscore
  { label: 'scope 1', pattern: /\bscope[\s\-_]*1\b/i },
  { label: 'scope 2', pattern: /\bscope[\s\-_]*2\b/i },
  { label: 'scope 3', pattern: /\bscope[\s\-_]*3\b/i },
  // Ranges / lists: "scope 1-3", "scopes 1–3", "scope 1, 2 and 3"
  {
    label: 'scope 1-3',
    pattern: /\bscopes?[\s\-_]*1\s*[-–—to]+\s*3\b/i,
  },
  {
    label: 'scopes 1, 2 and 3',
    pattern: /\bscopes?[\s\-_]*1\s*[,&]\s*2\s*(?:[,&]|and|och)\s*3\b/i,
  },
  // Roman numerals sometimes used in tables
  { label: 'scope I', pattern: /\bscope[\s\-_]+I\b/i },
  { label: 'scope II', pattern: /\bscope[\s\-_]+II\b/i },
  { label: 'scope III', pattern: /\bscope[\s\-_]+III\b/i },
]

export function detectEmissionsPresence(
  markdown: string | null | undefined
): EmissionsPresenceResult {
  if (!markdown || !markdown.trim()) {
    return { hasEmissionsMentions: false, matchedTerms: [] }
  }

  const matchedTerms: string[] = []
  for (const { label, pattern } of SCOPE_PATTERNS) {
    if (pattern.test(markdown)) {
      matchedTerms.push(label)
    }
  }

  return {
    hasEmissionsMentions: matchedTerms.length > 0,
    matchedTerms,
  }
}
