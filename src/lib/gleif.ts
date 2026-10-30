// Functions for the GLEIF API: https://documenter.getpostman.com/view/7679680/SVYrrxuU?version=latest

import { normalizeLei } from './normalizeLei'
import { normalizeIsin } from './normalizeIsin'
import { normalizeBic } from './normalizeBic'
import { MAX_AUTO_ISINS } from './gleifIdentifierWrite'

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

  const jurisdiction = record.attributes?.entity?.jurisdiction?.trim() || null

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

type GleifIsinRecord = {
  attributes?: {
    isin?: string
    lei?: string
  }
}

/** Parse GLEIF `/lei-records/{lei}/isins` payload into unique valid ISINs. */
export function gleifRecordsToIsins(records: unknown): string[] {
  if (!Array.isArray(records)) return []

  const byIsin = new Set<string>()
  for (const record of records) {
    const isin = normalizeIsin((record as GleifIsinRecord).attributes?.isin)
    if (isin) byIsin.add(isin)
  }
  return [...byIsin]
}

/**
 * Official ANNA/GLEIF LEI→ISIN mapping.
 * See https://api.gleif.org/api/v1/lei-records/{lei}/isins
 *
 * Stops after `maxPages` to avoid pulling mega-issuer dumps (100k+ ISINs)
 * into a single pipeline job. Returns `{ truncated: true }` when more remain.
 */
export async function getIsinsForLei(
  lei: string,
  options?: { maxPages?: number; pageSize?: number }
): Promise<{ isins: string[]; total: number; truncated: boolean }> {
  const normalizedLei = normalizeLei(lei)
  if (!normalizedLei) return { isins: [], total: 0, truncated: false }

  const pageSize = options?.pageSize ?? 50
  const maxPages = options?.maxPages ?? 3 // 150 ISINs max by default
  const isins: string[] = []
  let page = 1
  let lastPage = 1
  let total = 0

  while (page <= lastPage && page <= maxPages) {
    const response = await fetch(
      `https://api.gleif.org/api/v1/lei-records/${encodeURIComponent(normalizedLei)}/isins?page[number]=${page}&page[size]=${pageSize}`
    )
    if (!response.ok) {
      if (response.status === 404 && page === 1) {
        return { isins: [], total: 0, truncated: false }
      }
      throw new Error(
        `GLEIF ISIN lookup error ${response.status}: ${response.statusText}`
      )
    }

    const data = (await response.json()) as {
      data?: unknown
      meta?: { pagination?: { lastPage?: number; total?: number } }
    }
    total = data.meta?.pagination?.total ?? total
    lastPage = data.meta?.pagination?.lastPage ?? 1
    for (const isin of gleifRecordsToIsins(data.data)) {
      if (!isins.includes(isin)) isins.push(isin)
    }
    page += 1
  }

  // Only treat as truncated when we stopped early due to the page cap.
  // Do not use isins.length < total (invalid/duplicate ISINs reduce the count).
  const truncated = lastPage > maxPages
  return { isins, total: total || isins.length, truncated }
}

export type GleifLeiLinkedIdentifiers = {
  lei: string
  jurisdiction: string | null
  registeredAs: string | null
  bics: string[]
  isins: string[]
  isinTotal: number
  isinsTruncated: boolean
}

type GleifLeiRecordDetail = {
  attributes?: {
    lei?: string
    bic?: string[] | string | null
    entity?: {
      jurisdiction?: string
      registeredAs?: string | null
    }
  }
}

function parseBics(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : []
  const out: string[] = []
  for (const item of list) {
    if (typeof item !== 'string') continue
    const bic = normalizeBic(item)
    if (bic && !out.includes(bic)) out.push(bic)
  }
  return out
}

/**
 * Fetch LEI-linked identifiers from GLEIF (record + ISIN mapping). No LLM.
 */
export async function getGleifLinkedIdentifiers(
  lei: string,
  options?: { maxIsinPages?: number }
): Promise<GleifLeiLinkedIdentifiers | null> {
  const normalizedLei = normalizeLei(lei)
  if (!normalizedLei) return null

  const response = await fetch(
    `https://api.gleif.org/api/v1/lei-records/${encodeURIComponent(normalizedLei)}`
  )
  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error(
      `GLEIF LEI record error ${response.status}: ${response.statusText}`
    )
  }

  const payload = (await response.json()) as { data?: GleifLeiRecordDetail }
  const attrs = payload.data?.attributes
  const registeredAs = attrs?.entity?.registeredAs?.trim() || null
  const jurisdiction = attrs?.entity?.jurisdiction?.trim() || null
  const bics = parseBics(attrs?.bic)

  const maxIsinPages = options?.maxIsinPages ?? Math.ceil(MAX_AUTO_ISINS / 50)
  const isinResult = await getIsinsForLei(normalizedLei, {
    maxPages: maxIsinPages,
  })

  return {
    lei: normalizedLei,
    jurisdiction,
    registeredAs,
    bics,
    isins: isinResult.isins,
    isinTotal: isinResult.total,
    isinsTruncated: isinResult.truncated,
  }
}
