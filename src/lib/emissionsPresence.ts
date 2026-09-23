export type EmissionsPresenceResult = {
  hasEmissionsMentions: boolean
  matchedTerms: string[]
}

/**
 * Cheap regex scan for GHG Protocol Scope 1/2/3 language in report markdown.
 * Prefers false positives over false negatives — missing a real emissions
 * report is worse than occasionally continuing for a non-emissions PDF.
 */
const SCOPE_PATTERNS: { label: string; pattern: RegExp }[] = [
  // Explicit "scope 1", "scope 2", "scope 3" (word boundary after digit)
  { label: 'scope 1', pattern: /\bscope\s*1\b/i },
  { label: 'scope 2', pattern: /\bscope\s*2\b/i },
  { label: 'scope 3', pattern: /\bscope\s*3\b/i },
  // Ranges / lists: "scope 1-3", "scopes 1–3", "scope 1, 2 and 3"
  {
    label: 'scope 1-3',
    pattern: /\bscopes?\s*1\s*[-–—to]+\s*3\b/i,
  },
  {
    label: 'scopes 1, 2 and 3',
    pattern: /\bscopes?\s*1\s*[,&]\s*2\s*(?:[,&]|and|och)\s*3\b/i,
  },
  // Roman numerals sometimes used in tables
  { label: 'scope I', pattern: /\bscope\s+I\b/i },
  { label: 'scope II', pattern: /\bscope\s+II\b/i },
  { label: 'scope III', pattern: /\bscope\s+III\b/i },
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
