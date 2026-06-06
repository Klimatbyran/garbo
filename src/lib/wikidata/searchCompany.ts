import {
  EntityId,
  ItemId,
  SearchResponse,
  SearchResult,
} from 'wikibase-sdk'
import { wbk } from './util'
import { SearchEntitiesOptions } from 'wikibase-sdk/dist/src/queries/search_entities'
import { lookupKnownCompanyWikidataId } from './knownCompanyLookup'
import {
  expandInternationalAbbreviation,
  listingNameHasStripProbes,
  listingStripProbeQueries,
  listingSuffixProbeQueries,
  looksBalticListing,
  resultsIncludeExactLabel,
  stripLegalFormSuffixes,
  supplementaryLegalFormListingQueries,
} from './companySearchNames'
import {
  fetchSearchHitAugmentation,
  prioritizeCompanyLikeSearchResults,
  searchLabelAffinityScore,
} from './companySearchRanking'
import {
  fetchJsonWithRetries,
  WIKIDATA_SEARCH_HEADERS,
} from './wikidataHttp'

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
    limit: 50,
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

/**
 * Merges two hit lists by alternating indices and skipping duplicate ids — keeps
 * English crawl order while pulling in Swedish ranking (where Nordic listings
 * such as MTG → Q378944 or SCA → Q52601 often rank #1).
 */
function interleaveDedupeSearchResults(
  primary: SearchResult[],
  secondary: SearchResult[]
): SearchResult[] {
  const seen = new Set<string>()
  const out: SearchResult[] = []
  const n = Math.max(primary.length, secondary.length)
  for (let i = 0; i < n; i++) {
    if (i < primary.length) {
      const r = primary[i]
      if (!seen.has(r.id)) {
        seen.add(r.id)
        out.push(r)
      }
    }
    if (i < secondary.length) {
      const r = secondary[i]
      if (!seen.has(r.id)) {
        seen.add(r.id)
        out.push(r)
      }
    }
  }
  return out
}

const EXTRA_NORDIC_SEARCH_LANGUAGES: SearchEntitiesOptions['language'][] = [
  'fi',
  'et',
  'lv',
  'lt',
]

/**
 * When the UI language is English, also search in Swedish and interleave hits so
 * short tickers and Swedish labels (MTG, SCA, …) are not lost to unrelated en matches.
 * Optionally adds fi/et/lv/lt for Baltic listings or empty-result recovery.
 */
async function searchWikidataEntitiesForCompany(
  search: string,
  language: SearchEntitiesOptions['language'] | undefined,
  options?: { includeExtraNordicLanguages?: boolean }
): Promise<SearchResponse['search']> {
  const primary = await searchWikidataEntities(search, language)
  let merged = primary
  if (language === 'en') {
    const svHits = await searchWikidataEntities(search, 'sv')
    merged = interleaveDedupeSearchResults(merged, svHits)
  }
  if (options?.includeExtraNordicLanguages) {
    for (const lang of EXTRA_NORDIC_SEARCH_LANGUAGES) {
      if (lang === language) continue
      const hits = await searchWikidataEntities(search, lang)
      if (hits.length > 0) {
        merged = interleaveDedupeSearchResults(merged, hits)
      }
    }
  }
  return merged
}

async function mergeListingStripProbeResults(
  results: SearchResult[],
  companyName: string,
  language: SearchEntitiesOptions['language'] | undefined
): Promise<SearchResult[]> {
  let merged = results
  for (const query of listingStripProbeQueries(companyName)) {
    if (resultsIncludeExactLabel(merged, query)) break
    const fromProbe = await searchWikidataEntitiesForCompany(query, language, {
      includeExtraNordicLanguages: looksBalticListing(query),
    })
    if (fromProbe.length === 0) continue
    merged = interleaveDedupeSearchResults(fromProbe, merged)
    if (resultsIncludeExactLabel(merged, query)) break
  }
  return merged
}

async function mergeListingSuffixProbeResults(
  results: SearchResult[],
  companyName: string,
  language: SearchEntitiesOptions['language'] | undefined
): Promise<SearchResult[]> {
  let merged = results
  for (const query of listingSuffixProbeQueries(companyName)) {
    if (resultsIncludeExactLabel(merged, query)) continue
    const fromProbe = await searchWikidataEntitiesForCompany(query, language)
    if (fromProbe.length === 0) continue
    merged = interleaveDedupeSearchResults(fromProbe, merged)
  }
  return merged
}

function knownCompanySearchResult(
  companyName: string,
  wikidataId: string
): CompanySearchResult[] {
  return [
    {
      id: wikidataId,
      label: companyName,
      description: '',
      url: `https://www.wikidata.org/wiki/${wikidataId}`,
      match: { type: 'label', language: 'en', text: companyName },
    } as CompanySearchResult,
  ]
}

export async function searchCompany({
  companyName,
  /** `wbsearchentities` UI language; default `en` suits international company names. Pass `sv`, `de`, etc. when you know the listing's primary locale. */
  language = 'en',
  /**
   * When true, return a Klimatkollen-known Wikidata id from the bundled registry
   * or Garbo API before calling Wikidata search. Off by default so search-quality
   * tests still exercise live `wbsearchentities`.
   */
  useKnownIdLookup = false,
}: {
  companyName: string
  language?: SearchEntitiesOptions['language']
  useKnownIdLookup?: boolean
}): Promise<CompanySearchResult[]> {
  if (useKnownIdLookup) {
    const knownId = await lookupKnownCompanyWikidataId(companyName)
    if (knownId) return knownCompanySearchResult(companyName, knownId)
  }

  const balticListing = looksBalticListing(companyName)
  let results = await searchWikidataEntitiesForCompany(companyName, language, {
    includeExtraNordicLanguages: balticListing,
  })

  if (results.length === 0) {
    const simplified = stripLegalFormSuffixes(companyName)
    if (simplified) {
      results = await searchWikidataEntitiesForCompany(simplified, language, {
        includeExtraNordicLanguages: balticListing,
      })
    }
  }

  if (results.length === 0 && companyName.includes('Int')) {
    const expanded = expandInternationalAbbreviation(companyName)
    if (expanded) {
      results = await searchWikidataEntitiesForCompany(expanded, language, {
        includeExtraNordicLanguages: balticListing,
      })
    }
  }

  if (listingNameHasStripProbes(companyName)) {
    results = await mergeListingStripProbeResults(
      results,
      companyName,
      language
    )
  }

  results = await mergeListingSuffixProbeResults(
    results,
    companyName,
    language
  )

  if (results.length > 0) {
    let augmentation = await fetchSearchHitAugmentation(
      results.map((r) => r.id),
      language
    )

    /** e.g. "Lundin Mining Corp." → only legal case Q137125375; stripped "Lundin Mining" finds Q1537901 */
    const everyHitNonCompany = results.every(
      (r) => !augmentation.get(r.id)?.companyLike
    )
    const hasCompanyLikeListingMatch = results.some(
      (r) =>
        augmentation.get(r.id)?.companyLike === true &&
        searchLabelAffinityScore(r, companyName) >= 440_000
    )
    if (everyHitNonCompany || !hasCompanyLikeListingMatch) {
      const simplified = stripLegalFormSuffixes(companyName)
      if (simplified) {
        const fromStrip = await searchWikidataEntitiesForCompany(
          simplified,
          language
        )
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
          const fromLegal = await searchWikidataEntitiesForCompany(
            listingQuery,
            language
          )
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
      companyName
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
