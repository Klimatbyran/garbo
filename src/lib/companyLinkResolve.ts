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
  | { action: 'ambiguous'; candidates: CompanyLinkCandidate[] }
  | { action: 'create' }

export { stripLegalEntitySuffixes }

export function normalizeCompanyNameForMatch(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase('sv-SE')
    .split(/\s+/)
    .filter((word) => !isLegalEntitySuffix(word))
    .join(' ')
    .trim()
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
 * Auto-link only when exactly one candidate matches the normalized name.
 * Any fuzzy hit without a single exact match goes to staff (including a lone non-exact hit).
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

  return { action: 'ambiguous', candidates: uniqueCandidates }
}
