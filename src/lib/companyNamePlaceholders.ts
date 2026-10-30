/**
 * LLM / registry placeholders that must never become Company.name.
 * Production has seen the string "null" when prompts ask for JSON null.
 */
const PLACEHOLDER_COMPANY_NAMES = new Set([
  'null',
  'unknown',
  'n/a',
  'undefined',
])

/** True for empty values and known placeholder strings (case-insensitive). */
export function isPlaceholderCompanyName(name?: string | null): boolean {
  if (name == null || typeof name !== 'string') return true
  const trimmed = name.trim()
  if (!trimmed) return true
  return PLACEHOLDER_COMPANY_NAMES.has(trimmed.toLocaleLowerCase('en-US'))
}

/**
 * Map an extracted or override name to a usable display name, or null when
 * missing / placeholder so callers can wait for staff input.
 */
export function sanitizeExtractedCompanyName(
  name?: string | null
): string | null {
  if (name == null || typeof name !== 'string') return null
  const trimmed = name.trim()
  if (!trimmed || isPlaceholderCompanyName(trimmed)) return null
  return trimmed
}
