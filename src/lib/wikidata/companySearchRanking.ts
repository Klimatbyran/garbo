import { Entity, EntityId, ItemId, SearchResult } from 'wikibase-sdk'
import { wbk } from './util'
import { WbGetEntitiesResponse } from 'wikibase-sdk/dist/src/helpers/parse_responses'
import { SearchEntitiesOptions } from 'wikibase-sdk/dist/src/queries/search_entities'
import { fetchJsonWithRetries, WIKIDATA_SEARCH_HEADERS } from './wikidataHttp'
import { normalizeCompanyName } from './companyRegistry'
import {
  listingStripProbeQueries,
  normalizedHitLabel,
} from './companySearchNames'

/** `wbgetentities` returns sitelinks; the SDK `Entity` type omits them. */
type EntityWithSitelinks = Entity & {
  sitelinks?: Record<string, { title?: string } | undefined>
}

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

/** Country (P17) → Wikipedia site id for ranking with default search language `en`. */
const P17_COUNTRY_TO_WIKI_SITE: Readonly<Record<string, string>> = {
  Q34: 'svwiki', // Sweden
  Q33: 'fiwiki', // Finland
  Q20: 'nowiki', // Norway
  Q35: 'dawiki', // Denmark
  Q183: 'dewiki', // Germany
  Q142: 'frwiki', // France
  Q145: 'enwiki', // United Kingdom
  Q30: 'enwiki', // United States
  Q16: 'enwiki', // Canada
  Q408: 'nlwiki', // Netherlands
  Q38: 'itwiki', // Italy
  Q29: 'eswiki', // Spain
  Q211: 'lvwiki', // Latvia
  Q191: 'eewiki', // Estonia
  Q37: 'ltwiki', // Lithuania
  Q36: 'huwiki', // Hungary
  Q43: 'trwiki', // Turkey
  Q148: 'zhwiki', // China
  Q17: 'jawiki', // Japan
  Q884: 'kowiki', // South Korea
}

const WIKI_SITES_EXCLUDED_FROM_NOTABILITY_COUNT = new Set([
  'commonswiki',
  'specieswiki',
])

function collectP17CountryIds(entity: Entity | undefined): string[] {
  const out: string[] = []
  if (!entity || entity.type !== 'item') return out
  const p17 = entity.claims?.P17
  if (!p17) return out
  for (const claim of p17) {
    if (claim.mainsnak.snaktype !== 'value' || !claim.mainsnak.datavalue) {
      continue
    }
    const dv = claim.mainsnak.datavalue
    if (dv.type === 'wikibase-entityid' && 'id' in dv.value) {
      out.push(dv.value.id)
    }
  }
  return out
}

function countEncyclopediaSitelinks(
  sitelinks: EntityWithSitelinks['sitelinks'] | undefined
): number {
  if (!sitelinks) return 0
  let n = 0
  for (const key of Object.keys(sitelinks)) {
    if (!key.endsWith('wiki')) continue
    if (WIKI_SITES_EXCLUDED_FROM_NOTABILITY_COUNT.has(key)) continue
    const e = sitelinks[key]
    if (
      e &&
      typeof e === 'object' &&
      'title' in e &&
      (e as { title?: string }).title
    )
      n++
  }
  return n
}

/**
 * Higher = stronger disambiguation signal among company-like hits.
 * Tier gaps keep raw encyclopedia link counts below country/wiki tiers.
 */
function computeSitelinkPreferenceRank(
  entity: Entity | undefined,
  language: SearchEntitiesOptions['language'] | undefined
): number {
  if (!entity || entity.type !== 'item') return 0
  const sl = (entity as EntityWithSitelinks).sitelinks
  if (!sl) return 0

  const hasSite = (site: string) => {
    const e = sl[site]
    return Boolean(
      e &&
      typeof e === 'object' &&
      'title' in e &&
      (e as { title?: string }).title
    )
  }

  if (language && hasSite(`${language}wiki`)) return 1_000_000
  if ((language === 'nb' || language === 'nn') && hasSite('nowiki'))
    return 950_000

  for (const c of collectP17CountryIds(entity)) {
    const site = P17_COUNTRY_TO_WIKI_SITE[c]
    if (site && hasSite(site)) return 800_000
  }

  if (hasSite('enwiki')) return 600_000

  return countEncyclopediaSitelinks(sl)
}

/**
 * Wikidata search returns an item `label` per hit (often distinct from aliases).
 * Prefer labels close to the query so "Mips" → **Mips AB** (Q109787297) ranks above
 * **MIPS Technologies** (Q1631366), which only shares the first token.
 */
export function searchLabelAffinityScore(
  result: SearchResult,
  companyName: string
): number {
  const q = normalizeCompanyName(companyName).toLowerCase()
  const raw = (result.label ?? '').trim()
  if (!q || !raw) return 0
  const label = raw.toLowerCase().replace(/\s+/g, ' ')

  if (label === q) return 500_000
  if (label === `${q} ab`) return 450_000
  if (label === `${q} group`) return 450_000

  for (const probe of listingStripProbeQueries(companyName)) {
    if (label === normalizedHitLabel(probe)) return 460_000
  }

  if (label === `investment ab ${q}`) return 460_000
  if (label === `${q} (sweden)`) return 440_000
  if (label.startsWith(`${q} sverige`)) return 450_000

  const legalSecondToken = new Set([
    'ab',
    'ltd',
    'plc',
    'corp',
    'inc',
    'nv',
    'ag',
    'asa',
    'oy',
    'bv',
    'gmbh',
    'llc',
    'oyj',
    'lp',
    'llp',
  ])
  const parts = label.split(/\s+/)
  if (parts.length === 2 && parts[0] === q) {
    const tail = parts[1].replace(/\./g, '')
    if (legalSecondToken.has(tail)) return 440_000
    return 85_000
  }
  if (parts.length >= 2 && parts[0] === q) return 45_000

  return 0
}

type SearchHitAugmentation = {
  companyLike: boolean
  industryIds: ItemId[]
  sitelinkPreferenceRank: number
}

export async function fetchSearchHitAugmentation(
  ids: string[],
  language: SearchEntitiesOptions['language'] | undefined
): Promise<Map<string, SearchHitAugmentation>> {
  const byId = new Map<string, SearchHitAugmentation>()
  if (ids.length === 0) return byId

  const chunkSize = 50
  for (let offset = 0; offset < ids.length; offset += chunkSize) {
    const chunk = ids.slice(offset, offset + chunkSize)
    const url = wbk.getEntities({
      ids: chunk as EntityId[],
      props: ['claims', 'sitelinks'],
      languages: ['en'],
    })
    const { entities } = await fetchJsonWithRetries<WbGetEntitiesResponse>(
      url,
      {
        headers: { ...WIKIDATA_SEARCH_HEADERS },
        maxAttempts: 3,
        expectedContentType: 'application/json',
        context: 'Wikidata entities (P31, P452, sitelinks)',
      }
    )

    for (const id of chunk) {
      const entity = entities[id]
      const instanceOf = collectInstanceOfIds(entity)
      const companyLike = [...instanceOf].some((q) =>
        COMPANY_LIKE_INSTANCE_OF.has(q)
      )
      const industryIds = collectItemIdsForProperty(entity, INDUSTRY)
      const sitelinkPreferenceRank = computeSitelinkPreferenceRank(
        entity,
        language
      )
      byId.set(id, { companyLike, industryIds, sitelinkPreferenceRank })
    }
  }
  return byId
}

export function prioritizeCompanyLikeSearchResults(
  results: SearchResult[],
  augmentation: Map<string, SearchHitAugmentation>,
  companyName: string
): SearchResult[] {
  const isCo = (r: SearchResult) => augmentation.get(r.id)?.companyLike === true
  const rankOf = (r: SearchResult) =>
    (augmentation.get(r.id)?.sitelinkPreferenceRank ?? 0) +
    searchLabelAffinityScore(r, companyName)

  const index = new Map(results.map((r, i) => [r.id, i]))
  const companyHits = results.filter(isCo).sort((a, b) => {
    const d = rankOf(b) - rankOf(a)
    if (d !== 0) return d
    return (index.get(a.id) ?? 0) - (index.get(b.id) ?? 0)
  })
  const nonCompany = results.filter((r) => !isCo(r))
  return [...companyHits, ...nonCompany]
}
