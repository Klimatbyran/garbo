// Functions for the GLEIF API: https://documenter.getpostman.com/view/7679680/SVYrrxuU?version=latest

import { normalizeLei } from './normalizeLei'

/** Slim LEI candidate for LLM selection — excludes registration.managingLou. */
export type GleifLeiCandidate = {
  lei: string
  legalName: string
  jurisdiction: string | null
}

type GleifApiLeiRecord = {
  attributes?: {
    lei?: string
    entity?: {
      legalName?: { name?: string }
      jurisdiction?: string
    }
    registration?: {
      managingLou?: string
    }
  }
}

function toGleifLeiCandidate(
  record: GleifApiLeiRecord
): GleifLeiCandidate | null {
  const lei = normalizeLei(record.attributes?.lei)
  if (!lei) return null

  const legalName = record.attributes?.entity?.legalName?.name?.trim()
  if (!legalName) return null

  const jurisdiction =
    record.attributes?.entity?.jurisdiction?.trim() || null

  return { lei, legalName, jurisdiction }
}

/** Map raw GLEIF lei-records into slim entity candidates (no managingLou). */
export function gleifRecordsToLeiCandidates(
  records: unknown
): GleifLeiCandidate[] {
  if (!Array.isArray(records)) return []

  const byLei = new Map<string, GleifLeiCandidate>()
  for (const record of records) {
    const candidate = toGleifLeiCandidate(record as GleifApiLeiRecord)
    if (!candidate) continue
    byLei.set(candidate.lei, candidate)
  }
  return [...byLei.values()]
}

/** True when `lei` is one of the entity LEIs from GLEIF search (not a managingLou). */
export function isLeiAmongGleifCandidates(
  lei: string,
  candidates: GleifLeiCandidate[]
): boolean {
  const normalized = normalizeLei(lei)
  if (!normalized) return false
  return candidates.some((candidate) => candidate.lei === normalized)
}

/**
 * Keep an LLM (or other) LEI pick only when it matches an entity LEI from the
 * slim GLEIF candidate list — rejects managingLou and invented values.
 */
export function acceptLeiFromGleifCandidates(
  selectedLei: string,
  candidates: GleifLeiCandidate[],
  log?: (message: string) => void
): string | undefined {
  const normalized = normalizeLei(selectedLei)
  if (!normalized) {
    log?.(
      `❌ Selected invalid LEI '${selectedLei}' — ignoring (not a valid checksum LEI).`
    )
    return undefined
  }

  if (!isLeiAmongGleifCandidates(normalized, candidates)) {
    log?.(
      `❌ Selected LEI '${normalized}' which is not in the GLEIF entity candidate list — ignoring (possible managingLou or invented value).`
    )
    return undefined
  }

  return normalized
}

export async function getLEINumbersFromGLEIF(
  companyName: string
): Promise<GleifLeiCandidate[]> {
  const response = await fetch(
    `https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=${encodeURIComponent(companyName)}&page[number]=1&page[size]=50`
  )
  if (!response.ok) {
    console.log(`Error ${response.status}: ${response.statusText}`)
    return []
  }

  const data = await response.json()
  return gleifRecordsToLeiCandidates(data.data)
}

/** Look up a single LEI record by LEI value. */
export async function getGleifLeiCandidateByLei(
  lei: string
): Promise<GleifLeiCandidate | null> {
  const normalized = normalizeLei(lei)
  if (!normalized) return null

  const response = await fetch(
    `https://api.gleif.org/api/v1/lei-records/${encodeURIComponent(normalized)}`
  )
  if (!response.ok) {
    console.log(`Error ${response.status}: ${response.statusText}`)
    return null
  }

  const data = await response.json()
  return toGleifLeiCandidate(data.data as GleifApiLeiRecord)
}
