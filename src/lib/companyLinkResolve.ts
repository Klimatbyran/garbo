import {
  isLegalEntitySuffix,
  stripLegalEntitySuffixes,
} from './companyLegalEntitySuffixes'

export type CompanyLinkCandidate = {
  id: string
  name: string
  wikidataId?: string | null
  lei?: string | null
}

export type CompanyLinkResolution =
  | { action: 'resolve'; companyId: string }
  | {
      action: 'ambiguous'
      candidates: CompanyLinkCandidate[]
      /** True when candidates matched on shared core token (e.g. Sampo Group vs Sampo plc). */
      partialNameMatch?: boolean
    }
  | { action: 'create' }

/** Minimum length for the first normalized token to count as a company core name. */
const COMPANY_CORE_TOKEN_MIN_LENGTH = 3

/**
 * First significant token after legal-suffix normalization (e.g. "sampo" from "Sampo Group").
 * Used to surface partial name matches for staff review.
 */
export function companyNameCoreToken(name: string): string | null {
  const normalized = normalizeCompanyNameForMatch(name)
  const token = normalized.split(/\s+/).filter(Boolean)[0]
  if (!token || token.length < COMPANY_CORE_TOKEN_MIN_LENGTH) return null
  return token
}

export function shareCompanyNameCore(a: string, b: string): boolean {
  const coreA = companyNameCoreToken(a)
  const coreB = companyNameCoreToken(b)
  return coreA !== null && coreA === coreB
}

/**
 * True when names share a core token but differ beyond legal-entity suffixes
 * (e.g. Sampo Group vs Sampo plc). Excludes same-core unrelated pairs like
 * Nordic Capital vs Nordic Paper.
 */
export function isPartialCompanyNameMatch(a: string, b: string): boolean {
  if (!shareCompanyNameCore(a, b)) return false

  const normA = normalizeCompanyNameForMatch(a)
  const normB = normalizeCompanyNameForMatch(b)
  if (normA === normB) return false

  const core = companyNameCoreToken(a)
  if (!core) return false

  const wordsA = normA.split(/\s+/).filter(Boolean)
  const wordsB = normB.split(/\s+/).filter(Boolean)
  if (wordsA[0] !== core || wordsB[0] !== core) return false

  const significantA = wordsA
    .slice(1)
    .filter((word) => !isLegalEntitySuffix(word))
  const significantB = wordsB
    .slice(1)
    .filter((word) => !isLegalEntitySuffix(word))
  if (
    significantA.length > 0 &&
    significantB.length > 0 &&
    significantA.join(' ') !== significantB.join(' ')
  ) {
    return false
  }

  return true
}

export function pickPartialNameMatches(
  extractedName: string,
  candidates: CompanyLinkCandidate[]
): CompanyLinkCandidate[] {
  return candidates.filter(
    (candidate) =>
      candidate.name && isPartialCompanyNameMatch(extractedName, candidate.name)
  )
}

export { stripLegalEntitySuffixes }

/** Fold accents/diacritics so "Nestlé" and "Nestle" normalize to the same match key. */
export function foldDiacriticsForCompanyMatch(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '')
}

/** True when the string contains accents/diacritics beyond ASCII folding. */
export function companyNameHasDiacritics(text: string): boolean {
  return foldDiacriticsForCompanyMatch(text) !== text
}

/**
 * When two names match under diacritic folding, keep or upgrade to the richer
 * spelling — never replace "Nestlé" with "Nestle" on PATCH.
 */
export type ResolveCompanyDisplayNameOptions = {
  staffDisplayName?: string | null
  /** Prefer the pipeline-extracted name on partial core-token matches (e.g. Sampo Group vs Sampo plc). */
  preferIncomingOnPartialMatch?: boolean
}

/**
 * Pick the display name for a company row: staff override wins, then partial-match
 * upgrade rules, then diacritic-safe merge.
 */
export function resolveCompanyDisplayName(
  existingName: string | null | undefined,
  incomingName: string,
  options?: ResolveCompanyDisplayNameOptions
): string {
  const staff = options?.staffDisplayName?.trim()
  if (staff) return staff

  const incoming = incomingName.trim()
  const existing = existingName?.trim()

  if (
    options?.preferIncomingOnPartialMatch &&
    existing &&
    incoming &&
    shareCompanyNameCore(existing, incoming) &&
    normalizeCompanyNameForMatch(existing) !==
      normalizeCompanyNameForMatch(incoming)
  ) {
    return incoming
  }

  return preferRicherDiacriticCompanyName(existingName, incomingName)
}

export function preferRicherDiacriticCompanyName(
  existingName: string | null | undefined,
  incomingName: string
): string {
  const incoming = incomingName.trim()
  const existing = existingName?.trim()

  if (!existing) return incoming
  if (!incoming) return existing

  if (
    normalizeCompanyNameForMatch(existing) !==
    normalizeCompanyNameForMatch(incoming)
  ) {
    // Partial core-token match (e.g. Sampo Group vs Sampo plc): keep existing
    // display name — never downgrade on a later pipeline run.
    if (shareCompanyNameCore(existing, incoming)) return existing
    return incoming
  }

  const existingHasDiacritics = companyNameHasDiacritics(existing)
  const incomingHasDiacritics = companyNameHasDiacritics(incoming)

  if (existingHasDiacritics && !incomingHasDiacritics) return existing
  if (incomingHasDiacritics && !existingHasDiacritics) return incoming
  return existing
}

/**
 * Stable match key for company names: fold diacritics, lowercase, strip
 * punctuation/noise, collapse whitespace, drop legal-entity tokens.
 * Use for equality checks and alternative-name dedupe — not for display.
 */
export function companyNameMatchKey(name: string): string {
  return (
    foldDiacriticsForCompanyMatch(name)
      .trim()
      .toLocaleLowerCase('sv-SE')
      // Preserve Nordic slash-form suffixes before `/` becomes a separator.
      .replace(/\ba\s*\/\s*s\b/g, 'as')
      .replace(/\bas\s*\/\s*a\b/g, 'asa')
      // "A.B." → "ab" so legal-suffix stripping still sees a single token
      .replace(/\./g, '')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .split(' ')
      .filter((word) => word.length > 0 && !isLegalEntitySuffix(word))
      .join(' ')
      .trim()
  )
}

/** Historical name; delegates to {@link companyNameMatchKey}. */
export function normalizeCompanyNameForMatch(name: string): string {
  return companyNameMatchKey(name)
}

export function dedupeCompanyLinkCandidates(
  candidates: CompanyLinkCandidate[]
): CompanyLinkCandidate[] {
  const seen = new Set<string>()
  return candidates.filter((candidate) => {
    if (seen.has(candidate.id)) return false
    seen.add(candidate.id)
    return true
  })
}

export function pickExactNameMatches(
  extractedName: string,
  candidates: CompanyLinkCandidate[]
): CompanyLinkCandidate[] {
  const target = normalizeCompanyNameForMatch(extractedName)
  return candidates.filter(
    (candidate) =>
      candidate.name && normalizeCompanyNameForMatch(candidate.name) === target
  )
}

/**
 * True when a Wikidata label is close enough to the pipeline company name to auto-approve.
 * Blocks subsidiary / unrelated picks (e.g. Sampo Group → If P&C Insurance).
 */
export function wikidataSelectionMatchesCompanyName(
  companyName: string,
  wikidataLabel: string
): boolean {
  const label = wikidataLabel.trim()
  if (!label) return false

  const candidate: CompanyLinkCandidate = { id: '_', name: label }
  if (pickExactNameMatches(companyName, [candidate]).length > 0) return true
  if (isPartialCompanyNameMatch(companyName, label)) return true
  return false
}

/**
 * Decide whether to auto-link, ask a human, or create a new company.
 * Auto-link only when exactly one candidate matches the normalized name.
 * Partial core-token matches (e.g. Sampo Group vs Sampo plc) go to staff with a focused candidate list.
 * Any other fuzzy hit without a single exact match also goes to staff.
 */
export function assessCompanyLinkResolution(
  extractedName: string,
  candidates: CompanyLinkCandidate[]
): CompanyLinkResolution {
  const uniqueCandidates = dedupeCompanyLinkCandidates(candidates)

  if (uniqueCandidates.length === 0) {
    return { action: 'create' }
  }

  const exactMatches = pickExactNameMatches(extractedName, uniqueCandidates)

  if (exactMatches.length === 1) {
    return { action: 'resolve', companyId: exactMatches[0].id }
  }

  if (exactMatches.length > 1) {
    return {
      action: 'ambiguous',
      candidates: dedupeCompanyLinkCandidates(exactMatches),
    }
  }

  const partialMatches = pickPartialNameMatches(extractedName, uniqueCandidates)
  if (partialMatches.length >= 1) {
    return {
      action: 'ambiguous',
      candidates: dedupeCompanyLinkCandidates(partialMatches),
      partialNameMatch: true,
    }
  }

  return { action: 'ambiguous', candidates: uniqueCandidates }
}
