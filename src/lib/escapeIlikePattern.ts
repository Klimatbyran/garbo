/** Escape `%` / `_` / `\` so LIKE/ILIKE treats user input as a literal substring. */
export function escapeIlikePattern(raw: string): string {
  return raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export type CompanyNameSearchPatterns = {
  /** `term%` — prefix match, ranked above substring. */
  prefixPattern: string
  /** `%term%` — mid-name / mid-word substring match. */
  containsPattern: string
}

/**
 * Build escaped LIKE patterns for staff company name search.
 * Callers must use `ESCAPE '\\'` so the escapes are honored.
 */
export function companyNameSearchPatterns(
  normalizedSearchTerm: string
): CompanyNameSearchPatterns {
  const escaped = escapeIlikePattern(normalizedSearchTerm)
  return {
    prefixPattern: `${escaped}%`,
    containsPattern: `%${escaped}%`,
  }
}
