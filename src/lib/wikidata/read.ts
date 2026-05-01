import {
  Entity,
  EntityId,
  ItemId,
  SearchResponse,
  SearchResult,
} from 'wikibase-sdk'
import { Claim, transformFromWikidataDateStringToDate, wbk } from './util'
import { WbGetEntitiesResponse } from 'wikibase-sdk/dist/src/helpers/parse_responses'
import { SearchEntitiesOptions } from 'wikibase-sdk/dist/src/queries/search_entities'
import wikidataConfig from '../../config/wikidata'

const {
  CARBON_FOOTPRINT,
  START_TIME,
  END_TIME,
  REFERENCE_URL,
  OBJECT_OF_STATEMENT_HAS_ROLE,
  APPLIES_TO_PART,
  ARCHIVE_URL,
} = wikidataConfig.properties

async function fetchJsonWithRetries<T = unknown>(
  url: string,
  {
    headers,
    maxAttempts = 3,
    expectedContentType = 'application/json',
    context,
  }: {
    headers?: Record<string, string>
    maxAttempts?: number
    expectedContentType?: string
    context?: string
  }
): Promise<T> {
  let attempt = 0
  let res: Response | undefined
  while (attempt < maxAttempts) {
    res = await fetch(url, { headers })
    if (res.ok) break
    if ([429, 502, 503, 504].includes(res.status)) {
      await new Promise((r) => setTimeout(r, (attempt + 1) * 1000))
      attempt++
      continue
    }
    break
  }

  const ctx = context ? `${context} ` : ''

  if (!res) {
    throw new Error(`${ctx}no response received`)
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `${ctx}HTTP ${res.status} ${res.statusText} – body: ${text.slice(0, 300)}`
    )
  }

  const ct = (res.headers.get('content-type') || '').toLowerCase()
  if (!ct.includes(expectedContentType)) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `${ctx}returned non-JSON (${ct}) – body: ${text.slice(0, 300)}`
    )
  }

  return (await res.json()) as T
}

export async function getWikipediaTitle(id: EntityId): Promise<string> {
  const url = wbk.getEntities({
    ids: [id],
    props: ['sitelinks'],
  })
  const { entities }: WbGetEntitiesResponse = await fetch(url).then((res) =>
    res.json()
  )
  const entity = entities[id]
  const sitelinks = entity?.type === 'item' ? entity.sitelinks : undefined
  const title = sitelinks?.enwiki?.title ?? sitelinks?.svwiki?.title ?? null

  if (!title) {
    throw new Error('No Wikipedia site link found')
  }

  return title
}

export async function getLEINumber(
  entity: EntityId
): Promise<string | undefined> {
  const url = wbk.getEntities({
    ids: entity,
    languages: ['en'],
  })

  const res = await fetch(url)
  const wikidataEntities = (await res.json()).entities

  if (wikidataEntities === undefined) {
    return
  }

  const { claims } = wikidataEntities[entity]

  if (
    claims === undefined ||
    claims['P1278'] === undefined ||
    claims['P1278'].length === 0
  ) {
    return
  }

  return claims['P1278'][0].mainsnak.datavalue.value
}

/** Trailing company legal forms often omitted from Wikidata labels (e.g. "… Group AB" vs "… Group"). */
const LEGAL_FORM_SUFFIXES = new Set([
  'ab',
  'aktiebolag',
  'ag',
  'asa',
  'bv',
  'corp',
  'corporation',
  'gmbh',
  'group',
  'inc',
  'incorporated',
  'int',
  'international',
  'koncern',
  'limited',
  'llc',
  'llp',
  'lp',
  'ltd',
  'nv',
  'oy',
  'oyj',
  'plc',
  'publ',
  'scandinavia',
  'company',
])

function normalizeCompanySearchName(companyName: string): string {
  return companyName.replace(/,/g, ' ').trim().replace(/\s+/g, ' ')
}

/**
 * Removes one or more trailing legal-form tokens (e.g. AB, Ltd, or "(AB)", "(publ)").
 * Returns null if nothing was removed or the remainder would be empty.
 */
function stripLegalFormSuffixes(companyName: string): string | null {
  let s = normalizeCompanySearchName(companyName)
  if (!s) return null
  const original = s

  while (s.length > 0) {
    const parenMatch = s.match(/^(.+?)\s*\(([^)]+)\)\s*$/i)
    if (parenMatch) {
      const rest = parenMatch[1].trim().replace(/^\.+|\.+$/g, '')
      const innerNorm = parenMatch[2].toLowerCase().replace(/\./g, '').trim()
      if (rest && LEGAL_FORM_SUFFIXES.has(innerNorm)) {
        s = rest
        continue
      }
    }

    const match = s.match(/^(.+?)\s+([^\s]+)\.?$/i)
    if (!match) break
    const rest = match[1].trim().replace(/^\.+|\.+$/g, '')
    const lastNorm = match[2].toLowerCase().replace(/\./g, '')
    if (!LEGAL_FORM_SUFFIXES.has(lastNorm)) break
    if (!rest) break
    s = rest
  }

  return s !== original && s.length > 0 ? s : null
}

/**
 * Expands the common corporate abbreviation "Int." ("International") so
 * Wikidata search can match labels like "Millicom" that omit the short form
 * (e.g. "Millicom Int. Cellular" → no hits; "Millicom International Cellular" → Q276345).
 */
function expandInternationalAbbreviation(companyName: string): string | null {
  const normalized = normalizeCompanySearchName(companyName)
  if (!/\bInt\./i.test(normalized)) return null
  const expanded = normalized
    .replace(/\bInt\.\s*/gi, 'International ')
    .replace(/\bInt\./gi, 'International ')
    .trim()
    .replace(/\s+/g, ' ')
  return expanded !== normalized ? expanded : null
}

/**
 * Wikidata often lists companies with a legal-form suffix ("Evolution AB", "Acme Ltd").
 * Plain-name search can miss the item entirely (e.g. "Evolution" → biology). When every
 * hit lacks a company-like P31, we probe {@link LEGAL_FORM_SUFFIXES} in order.
 */
function legalFormSuffixAppendLabel(norm: string): string {
  const lowerShort: Record<string, string> = {
    ltd: 'Ltd',
    plc: 'plc',
    corp: 'Corp',
    inc: 'Inc',
    gmbh: 'GmbH',
    publ: '(publ)',
    int: 'Int',
  }
  if (lowerShort[norm]) return lowerShort[norm]
  if (norm.length >= 5) return norm.charAt(0).toUpperCase() + norm.slice(1)
  return norm.toUpperCase()
}

function nameAlreadyHasTrailingLegalSuffix(
  normalizedName: string,
  norm: string
): boolean {
  const paren = normalizedName.match(/^(.+?)\s*\(([^)]+)\)\s*$/i)
  if (paren) {
    const inner = paren[2].toLowerCase().replace(/\./g, '').trim()
    if (inner === norm) return true
  }
  const match = normalizedName.match(/^(.+?)\s+([^\s]+)\.?$/i)
  if (!match) return false
  const lastNorm = match[2].toLowerCase().replace(/\./g, '')
  return lastNorm === norm
}

/** Priority order: common Stockholm-list style first, then rest A–z. */
function legalFormNormsForSupplementarySearch(): string[] {
  return [...LEGAL_FORM_SUFFIXES].sort((a, b) => {
    if (a === 'ab') return -1
    if (b === 'ab') return 1
    return a.localeCompare(b)
  })
}

function supplementaryLegalFormListingQueries(companyName: string): string[] {
  const n = normalizeCompanySearchName(companyName)
  if (!n) return []
  const out: string[] = []
  for (const norm of legalFormNormsForSupplementarySearch()) {
    if (nameAlreadyHasTrailingLegalSuffix(n, norm)) continue
    out.push(`${n} ${legalFormSuffixAppendLabel(norm)}`)
  }
  return out
}

const WIKIDATA_SEARCH_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'KlimatkollenGarboBot/1.0 (+https://klimatkollen.se)',
} as const

/** Industry (P452) — item-valued; exposed on {@link searchCompany} hits under `statements.P452`. */
const INDUSTRY = 'P452' as const

/**
 * instance of (P31) object ids we treat as business/company-like for ranking.
 * Subclasses are not expanded (no subclass-of traversal).
 */
const COMPANY_LIKE_INSTANCE_OF = new Set<string>([
  'Q4830453', // business
  'Q783794', // company
  'Q6881511', // enterprise
  'Q891723', // public company
  'Q431289', // brand
  'Q4387609', // architectural firm
  'Q68295960', // Swedish government agency
])

function collectInstanceOfIds(entity: Entity | undefined): Set<string> {
  const ids = new Set<string>()
  if (!entity || entity.type !== 'item') return ids
  const p31 = entity.claims?.P31
  if (!p31) return ids
  for (const claim of p31) {
    if (claim.mainsnak.snaktype !== 'value' || !claim.mainsnak.datavalue) {
      continue
    }
    const dv = claim.mainsnak.datavalue
    if (dv.type === 'wikibase-entityid' && 'id' in dv.value) {
      ids.add(dv.value.id)
    }
  }
  return ids
}

function collectItemIdsForProperty(
  entity: Entity | undefined,
  property: string
): ItemId[] {
  const out: ItemId[] = []
  if (!entity || entity.type !== 'item') return out
  const claims = entity.claims?.[property]
  if (!claims) return out
  for (const claim of claims) {
    if (claim.mainsnak.snaktype !== 'value' || !claim.mainsnak.datavalue) {
      continue
    }
    const dv = claim.mainsnak.datavalue
    if (dv.type === 'wikibase-entityid' && 'id' in dv.value) {
      out.push(dv.value.id as ItemId)
    }
  }
  return out
}

type SearchHitAugmentation = {
  companyLike: boolean
  industryIds: ItemId[]
  /** Present when the item links to `{language}wiki` (helps disambiguate duplicate company items). */
  hasLanguageSitelink: boolean
}

function entityHasLanguageWikiSitelink(
  entity: Entity | undefined,
  language: SearchEntitiesOptions['language'] | undefined
): boolean {
  if (!entity || entity.type !== 'item' || !language) return false
  const key = `${language}wiki`
  const sl = entity.sitelinks?.[key]
  return Boolean(sl && typeof sl === 'object' && 'title' in sl && sl.title)
}

async function fetchSearchHitAugmentation(
  ids: string[],
  language: SearchEntitiesOptions['language'] | undefined
): Promise<Map<string, SearchHitAugmentation>> {
  const byId = new Map<string, SearchHitAugmentation>()
  if (ids.length === 0) return byId

  const url = wbk.getEntities({
    ids: ids as EntityId[],
    props: ['claims', 'sitelinks'],
    languages: ['en'],
  })
  const { entities } = await fetchJsonWithRetries<WbGetEntitiesResponse>(url, {
    headers: { ...WIKIDATA_SEARCH_HEADERS },
    maxAttempts: 3,
    expectedContentType: 'application/json',
    context: 'Wikidata entities (P31, P452, sitelinks)',
  })

  for (const id of ids) {
    const entity = entities[id]
    const instanceOf = collectInstanceOfIds(entity)
    const companyLike = [...instanceOf].some((q) =>
      COMPANY_LIKE_INSTANCE_OF.has(q)
    )
    const industryIds = collectItemIdsForProperty(entity, INDUSTRY)
    const hasLanguageSitelink = entityHasLanguageWikiSitelink(entity, language)
    byId.set(id, { companyLike, industryIds, hasLanguageSitelink })
  }
  return byId
}

function prioritizeCompanyLikeSearchResults(
  results: SearchResult[],
  augmentation: Map<string, SearchHitAugmentation>,
  language: SearchEntitiesOptions['language'] | undefined
): SearchResult[] {
  const isCo = (r: SearchResult) => augmentation.get(r.id)?.companyLike === true
  const hasLangSite = (r: SearchResult) =>
    Boolean(language && augmentation.get(r.id)?.hasLanguageSitelink === true)

  const withCompanyAndWiki = results.filter((r) => isCo(r) && hasLangSite(r))
  const withCompanyOnly = results.filter((r) => isCo(r) && !hasLangSite(r))
  const nonCompany = results.filter((r) => !isCo(r))
  return [...withCompanyAndWiki, ...withCompanyOnly, ...nonCompany]
}

export type CompanySearchResult = SearchResult & {
  /** Item QIDs for industry (P452), when present on the entity. */
  statements?: { P452?: ItemId[] }
}

async function searchWikidataEntities(
  search: string,
  language: SearchEntitiesOptions['language'] | undefined
): Promise<SearchResponse['search']> {
  const url = wbk.searchEntities({
    search,
    type: 'item',
    language,
    limit: 20,
  })
  const response = await fetchJsonWithRetries<SearchResponse>(url, {
    headers: { ...WIKIDATA_SEARCH_HEADERS },
    maxAttempts: 3,
    expectedContentType: 'application/json',
    context: 'Wikidata search',
  })
  if (response.error) {
    const msg = response.error.info || response.error.code
    throw new Error(`Wikidata search failed: ${msg}`)
  }
  return response.search ?? []
}

export async function searchCompany({
  companyName,
  language = 'sv',
}: {
  companyName
  language?: SearchEntitiesOptions['language']
}): Promise<CompanySearchResult[]> {
  let results = await searchWikidataEntities(companyName, language)

  if (results.length === 0) {
    const simplified = stripLegalFormSuffixes(companyName)
    if (simplified) {
      results = await searchWikidataEntities(simplified, language)
    }
  }

  if (results.length === 0) {
    const expanded = expandInternationalAbbreviation(companyName)
    if (expanded) {
      results = await searchWikidataEntities(expanded, language)
    }
  }

  if (results.length > 0) {
    let augmentation = await fetchSearchHitAugmentation(
      results.map((r) => r.id),
      language
    )

    /** e.g. "Lundin Mining Corp." → only legal case Q137125375; stripped "Lundin Mining" finds Q1537901 */
    const everyHitNonCompany = results.every(
      (r) => !augmentation.get(r.id)?.companyLike
    )
    if (everyHitNonCompany) {
      const simplified = stripLegalFormSuffixes(companyName)
      if (simplified) {
        const fromStrip = await searchWikidataEntities(simplified, language)
        if (fromStrip.length > 0) {
          results = fromStrip
          augmentation = await fetchSearchHitAugmentation(
            results.map((r) => r.id),
            language
          )
        }
      }

      const stillEveryNonCompany = results.every(
        (r) => !augmentation.get(r.id)?.companyLike
      )
      if (stillEveryNonCompany) {
        for (const listingQuery of supplementaryLegalFormListingQueries(
          companyName
        )) {
          const fromLegal = await searchWikidataEntities(listingQuery, language)
          if (fromLegal.length === 0) continue
          const augLegal = await fetchSearchHitAugmentation(
            fromLegal.map((r) => r.id),
            language
          )
          const anyCompany = fromLegal.some(
            (r) => augLegal.get(r.id)?.companyLike
          )
          if (anyCompany) {
            results = fromLegal
            augmentation = augLegal
            break
          }
        }
      }
    }

    results = prioritizeCompanyLikeSearchResults(
      results,
      augmentation,
      language
    )
    results = results.map((r) => {
      const industryIds = augmentation.get(r.id)?.industryIds ?? []
      const withIndustry: CompanySearchResult = { ...r }
      if (industryIds.length > 0) {
        withIndustry.statements = { P452: industryIds }
      }
      return withIndustry
    })
  }

  return results
}

export async function getWikidataEntities(ids: `Q${number}`[]) {
  const url = wbk.getEntities({
    ids,
    props: ['info', 'claims', 'descriptions', 'labels'],
  })
  const headers = {
    Accept: 'application/json',
    'User-Agent': 'KlimatkollenGarboBot/1.0 (+https://klimatkollen.se)',
  }

  const { entities }: WbGetEntitiesResponse =
    await fetchJsonWithRetries<WbGetEntitiesResponse>(url, {
      headers,
      maxAttempts: 3,
      expectedContentType: 'application/json',
      context: 'Wikidata entities',
    })

  return Object.values(entities) as (Entity & {
    labels: { [lang: string]: { language: string; value: string } }
    descriptions: { [lang: string]: { language: string; value: string } }
  })[]
}

export async function getClaims(entity: ItemId): Promise<Claim[]> {
  const url = wbk.getEntities({
    ids: entity,
    languages: ['en'],
  })

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.log(`Error ${res.status} ${res.statusText}`)
      throw new Error('Could not get entity claims')
    }

    const wikidataEntities = (await res.json()).entities
    if (wikidataEntities === undefined) {
      return []
    }

    const { claims } = wikidataEntities[entity]
    if (claims === undefined) {
      return []
    }

    const carbonFootprintClaims = claims[CARBON_FOOTPRINT] ?? []

    return carbonFootprintClaims.map((claim) => {
      const references =
        claim.references?.length > 0 ? claim.references[0].snaks : undefined

      const getQualifierValue = (
        propertyId: string,
        transformFn?: (value: unknown) => unknown
      ) => {
        const snaks = claim.qualifiers?.[propertyId]
        if (!snaks?.length) return ''
        const [
          {
            datavalue: { value },
          },
        ] = snaks
        return transformFn ? transformFn(value) : value
      }

      const getReferenceValue = (propertyId: string) => {
        if (!references || !references[propertyId]) return undefined
        return references[propertyId][0].datavalue.value
      }

      return {
        startDate: getQualifierValue(START_TIME, (value) =>
          transformFromWikidataDateStringToDate(
            (value as { time: string }).time
          )
        ),
        endDate: getQualifierValue(END_TIME, (value) =>
          transformFromWikidataDateStringToDate(
            (value as { time: string }).time
          )
        ),
        value: claim.mainsnak.datavalue.value.amount,
        category: getQualifierValue(
          APPLIES_TO_PART,
          (value) => (value as { id: ItemId }).id
        ),
        scope: getQualifierValue(
          OBJECT_OF_STATEMENT_HAS_ROLE,
          (value) => (value as { id: ItemId }).id
        ),
        id: claim.id,
        referenceUrl: getReferenceValue(REFERENCE_URL),
        archiveUrl: getReferenceValue(ARCHIVE_URL),
      } as Claim
    })
  } catch (error) {
    console.error(error)
    throw new Error(error)
  }
}
