import { Entity, EntityId, ItemId, SearchResponse } from 'wikibase-sdk'
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
  'inc',
  'incorporated',
  'limited',
  'llc',
  'llp',
  'lp',
  'ltd',
  'nv',
  'oy',
  'plc',
  'company',
])

/**
 * Removes one or more trailing legal-form tokens (e.g. AB, Ltd).
 * Returns null if nothing was removed or the remainder would be empty.
 */
function stripLegalFormSuffixes(companyName: string): string | null {
  let s = companyName.replace(/,/g, ' ').trim().replace(/\s+/g, ' ')
  if (!s) return null
  const original = s

  while (s.length > 0) {
    const match = s.match(/^(.+?)\s+([^\s]+)\.?$/i)
    if (!match) break
    const rest = match[1].trim()
    const lastNorm = match[2].toLowerCase().replace(/\./g, '')
    if (!LEGAL_FORM_SUFFIXES.has(lastNorm)) break
    if (!rest) break
    s = rest
  }

  return s !== original && s.length > 0 ? s : null
}

const WIKIDATA_SEARCH_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'KlimatkollenGarboBot/1.0 (+https://klimatkollen.se)',
} as const

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
}): Promise<SearchResponse['search']> {
  // TODO: try to search in multiple languages. Maybe we can find a page in English if it doesn't exist in Swedish?
  let results = await searchWikidataEntities(companyName, language)

  if (results.length === 0) {
    const simplified = stripLegalFormSuffixes(companyName)
    if (simplified) {
      results = await searchWikidataEntities(simplified, language)
    }
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
