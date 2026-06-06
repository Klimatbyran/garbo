import { describe, it, jest } from '@jest/globals'
import { searchCompany } from '../../src/lib/wikidata/read'
import companyWikidata from '../../src/data/klimatkollen-company-wikidata.json'
import {
  EXPECT_WIKIDATA_ID_IN_TOP,
  expectWikidataIdInTopResults,
} from './wikidata-search-assertions'

/**
 * Wikidata entity search — large-cap cases (live API).
 *
 * Large-cap rows come from `data/klimatkollen-company-wikidata.json`. We skip:
 * - {@link LARGE_CAP_SEARCH_SPECIAL_CASES} — listed separately (ranking quirks)
 * - {@link LARGE_CAP_SEARCH_EMPTY_RESULTS} — `searchCompany` returns no hits today
 */

type CompanyEntry = string | { wikidataId: string; tags?: string[] }

type NamedWikidataCase = Readonly<{
  companyName: string
  klimatkollenWikidataId: string
}>

/** Ranking quirks; Klimatkollen id must still appear in the top N. */
const LARGE_CAP_SEARCH_SPECIAL_CASES: ReadonlyArray<NamedWikidataCase> = [
  { companyName: 'Mips', klimatkollenWikidataId: 'Q109787297' },
  { companyName: 'SBB', klimatkollenWikidataId: 'Q93559269' },
]

/**
 * Known gaps: name shape (e.g. trailing “Group”), subclassing, or ambiguous hits —
 * `searchCompany` returns `[]` for these strings as of last alignment.
 */
const LARGE_CAP_SEARCH_EMPTY_RESULTS: ReadonlyArray<NamedWikidataCase> = []

const SPECIAL_CASE_NAMES = new Set(
  LARGE_CAP_SEARCH_SPECIAL_CASES.map((c) => c.companyName)
)

const EMPTY_RESULT_NAMES = new Set(
  LARGE_CAP_SEARCH_EMPTY_RESULTS.map((c) => c.companyName)
)

function largeCapCasesFromData(
  data: Record<string, CompanyEntry>
): [string, string][] {
  const out: [string, string][] = []
  for (const [name, val] of Object.entries(data)) {
    const wikidataId = typeof val === 'string' ? val : val.wikidataId
    const tags =
      typeof val === 'object' && val !== null && Array.isArray(val.tags)
        ? val.tags
        : []
    if (tags.includes('large-cap')) {
      out.push([name, wikidataId])
    }
  }
  return [...out].sort(([a], [b]) => a.localeCompare(b, 'sv'))
}

const regularCases = largeCapCasesFromData(
  companyWikidata as Record<string, CompanyEntry>
).filter(
  ([name]) => !SPECIAL_CASE_NAMES.has(name) && !EMPTY_RESULT_NAMES.has(name)
)

describe('searchCompany (large cap)', () => {
  jest.setTimeout(60_000)

  it.each(regularCases)(
    `resolves "%s" so Wikidata id %s appears in top ${EXPECT_WIKIDATA_ID_IN_TOP}`,
    async (name, id) => {
      const results = await searchCompany({ companyName: name })
      expectWikidataIdInTopResults(results, id)
    }
  )

  it.each(LARGE_CAP_SEARCH_SPECIAL_CASES)(
    'special: $companyName — Klimatkollen id $klimatkollenWikidataId in top ' +
      String(EXPECT_WIKIDATA_ID_IN_TOP),
    async ({ companyName, klimatkollenWikidataId }) => {
      const results = await searchCompany({ companyName })
      expectWikidataIdInTopResults(results, klimatkollenWikidataId)
    }
  )

  it.each(LARGE_CAP_SEARCH_EMPTY_RESULTS)(
    'returns no hits for $companyName (Klimatkollen $klimatkollenWikidataId)',
    async ({ companyName }) => {
      const results = await searchCompany({ companyName })
      expect(results).toHaveLength(0)
    }
  )
})
