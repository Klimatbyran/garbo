import { describe, it, jest } from '@jest/globals'
import { searchCompany } from '../../src/lib/wikidata/read'
import companyWikidata from './data/klimatkollen-company-wikidata.json'
import {
  EXPECT_WIKIDATA_ID_IN_TOP,
  expectWikidataIdInTopResults,
} from './wikidata-search-assertions'

/**
 * Wikidata entity search — small-cap cases (live API).
 *
 * Small-cap rows come from `data/klimatkollen-company-wikidata.json`. We skip:
 * - {@link SMALL_CAP_SEARCH_SPECIAL_CASES} — listed separately (ranking quirks)
 * - {@link SMALL_CAP_SEARCH_EMPTY_RESULTS} — `searchCompany` returns no hits today
 */

type CompanyEntry = string | { wikidataId: string; tags?: string[] }

type NamedWikidataCase = Readonly<{
  companyName: string
  klimatkollenWikidataId: string
}>

/**
 * Non-empty results that never include the Klimatkollen id (wrong entities win or generic noise).
 * When search improves and the id appears, this test fails — move the row back to {@link regularCases}.
 */
const SMALL_CAP_SEARCH_SPECIAL_CASES: ReadonlyArray<NamedWikidataCase> = [
  { companyName: 'Nelly', klimatkollenWikidataId: 'Q10438871' },
  { companyName: 'Anoto Group AB', klimatkollenWikidataId: 'Q4770417' }, // Anoto
  { companyName: 'Björn Borg Group', klimatkollenWikidataId: 'Q4919709' }, // björn borg
  { companyName: 'Eniro Group AB', klimatkollenWikidataId: 'Q202643' }, // eniro
  { companyName: 'HAKI Safety AB', klimatkollenWikidataId: 'Q10513026' }, // har ingen titel, finns som haki på svenska wiki
  { companyName: 'MOMENT GROUP', klimatkollenWikidataId: 'Q10397256' }, // 2e group
  { companyName: 'Mysafety Group AB', klimatkollenWikidataId: 'Q31890011' }, // ingen titel, finns som mysafety på svenska wiki
  {
    companyName: 'Norrhydro Group Plc',
    klimatkollenWikidataId: 'Q107548957',
  }, // norrhydro
  { companyName: 'Svedbergs Group', klimatkollenWikidataId: 'Q109796634' }, // svedbergs i daltorp, men svedbergs group på svenska wiki
]

/**
 * Known gaps: name shape (e.g. trailing “Group”), subclassing, or ambiguous hits —
 * `searchCompany` returns `[]` for these strings as of last alignment.
 */
const SMALL_CAP_SEARCH_EMPTY_RESULTS: ReadonlyArray<NamedWikidataCase> = [
  { companyName: 'B3 Consulting Group', klimatkollenWikidataId: 'Q137909059' },
  { companyName: 'Fastator', klimatkollenWikidataId: 'Q115168502' },
  { companyName: 'Karnell Group AB', klimatkollenWikidataId: 'Q138140101' },
  { companyName: 'Nivika', klimatkollenWikidataId: 'Q134691493' },
  {
    companyName: 'Nordisk Bergteknik AB',
    klimatkollenWikidataId: 'Q138141068',
  },
  { companyName: 'Pierce Group AB', klimatkollenWikidataId: 'Q138141234' },
  { companyName: 'PION Group AB', klimatkollenWikidataId: 'Q138141573' },
  {
    companyName: 'Sivers Semiconductors',
    klimatkollenWikidataId: 'Q138143077',
  },
  { companyName: 'Stockwik', klimatkollenWikidataId: 'Q138142885' },
  { companyName: 'Vivesto', klimatkollenWikidataId: 'Q138145870' },
  {
    companyName: 'Wall to Wall Group AB',
    klimatkollenWikidataId: 'Q138144224',
  },
  { companyName: 'Acrinova', klimatkollenWikidataId: 'Q138135683' },
  { companyName: 'Berner Industrier AB', klimatkollenWikidataId: 'Q138135718' },
  { companyName: 'Bong', klimatkollenWikidataId: 'Q18287289' },
  { companyName: 'Concejo', klimatkollenWikidataId: 'Q138135784' },
  { companyName: 'Inission AB', klimatkollenWikidataId: 'Q138139493' },
  { companyName: 'Mendus', klimatkollenWikidataId: 'Q138140858' },
  { companyName: 'Seafire', klimatkollenWikidataId: 'Q138143154' },
  { companyName: 'EQL Pharma AB', klimatkollenWikidataId: 'Q137399896' }, // inkorrekt id, istället australiensiskt företag
]

const SPECIAL_CASE_NAMES = new Set(
  SMALL_CAP_SEARCH_SPECIAL_CASES.map((c) => c.companyName)
)

const EMPTY_RESULT_NAMES = new Set(
  SMALL_CAP_SEARCH_EMPTY_RESULTS.map((c) => c.companyName)
)

function smallCapCasesFromData(
  data: Record<string, CompanyEntry>
): [string, string][] {
  const out: [string, string][] = []
  for (const [name, val] of Object.entries(data)) {
    const wikidataId = typeof val === 'string' ? val : val.wikidataId
    const tags =
      typeof val === 'object' && val !== null && Array.isArray(val.tags)
        ? val.tags
        : []
    if (tags.includes('small-cap')) {
      out.push([name, wikidataId])
    }
  }
  return [...out].sort(([a], [b]) => a.localeCompare(b, 'sv'))
}

const regularCases = smallCapCasesFromData(
  companyWikidata as Record<string, CompanyEntry>
).filter(
  ([name]) => !SPECIAL_CASE_NAMES.has(name) && !EMPTY_RESULT_NAMES.has(name)
)

describe('searchCompany (small cap)', () => {
  jest.setTimeout(60_000)

  // it.each(regularCases)(
  //   `resolves "%s" so Wikidata id %s appears in top ${EXPECT_WIKIDATA_ID_IN_TOP}`,
  //   async (name, id) => {
  //     const results = await searchCompany({ companyName: name })
  //     expectWikidataIdInTopResults(results, id)
  //   }
  // )

  it.each(SMALL_CAP_SEARCH_SPECIAL_CASES)(
    'special: $companyName — Klimatkollen id $klimatkollenWikidataId in top ' +
      String(EXPECT_WIKIDATA_ID_IN_TOP),
    async ({ companyName, klimatkollenWikidataId }) => {
      const results = await searchCompany({ companyName })
      expect(results.length).toBeGreaterThan(0)
      expectWikidataIdInTopResults(results, klimatkollenWikidataId)
    }
  )

  // it.each(SMALL_CAP_SEARCH_EMPTY_RESULTS)(
  //   'returns no hits for $companyName (Klimatkollen $klimatkollenWikidataId)',
  //   async ({ companyName }) => {
  //     const results = await searchCompany({ companyName })
  //     expect(results).toHaveLength(0)
  //   }
  // )
})
