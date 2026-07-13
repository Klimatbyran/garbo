const LEGAL_ENTITY_SUFFIXES = new Set([
  'ab',
  'the',
  'and',
  'inc',
  'co',
  'publ',
  '(publ)',
  '(ab)',
  'aktiebolag',
  'aktiebolaget',
])

export type CompanyLinkCandidate = {
  id: string
  name: string
  wikidataId?: string | null
}

export type CompanyLinkResolution =
  | { action: 'resolve'; companyId: string }
  | { action: 'ambiguous'; candidates: CompanyLinkCandidate[] }
  | { action: 'create' }

export function normalizeCompanyNameForMatch(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase('sv-SE')
    .split(/\s+/)
    .filter((word) => !LEGAL_ENTITY_SUFFIXES.has(word))
    .join(' ')
    .trim()
}

export function stripLegalEntitySuffixes(name: string): string {
  const stripped = name
    .trim()
    .split(/\s+/)
    .filter((word) => !LEGAL_ENTITY_SUFFIXES.has(word.toLowerCase()))
    .join(' ')
    .trim()
  return stripped || name.trim()
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
 * Decide whether to auto-link, ask a human, or create a new company.
 * Ask when multiple candidates exist and there is not exactly one exact name match.
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

  if (uniqueCandidates.length > 1) {
    return { action: 'ambiguous', candidates: uniqueCandidates }
  }

  return { action: 'create' }
}
