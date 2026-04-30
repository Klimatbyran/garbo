import { describe, expect, it, jest } from '@jest/globals'
import { searchCompany } from '../../src/lib/wikidata/read'
import companyWikidata from './data/klimatkollen-company-wikidata.json'
/**
 * Wikidata entity search — large-cap cases (live API).
 */

type CompanyEntry = string | { wikidataId: string; tags?: string[] }

/**
 * `klimatkollenWikidataId`: ID from `data/klimatkollen-company-wikidata.json`.
 * `firstSearchHitId`: first result from `searchCompany` when the suite was last
 * aligned (undefined = no results).
 */
const LARGE_CAP_SEARCH_SPECIAL_CASES: ReadonlyArray<{
  companyName: string
  klimatkollenWikidataId: string
  firstSearchHitId: string | undefined
}> = [
  // {
  //   companyName: 'Coop i Sverige',
  //   klimatkollenWikidataId: 'Q106684510',
  //   firstSearchHitId: undefined,
  // },
  // {
  //   companyName: 'Evolution',
  //   klimatkollenWikidataId: 'Q105965579',
  //   firstSearchHitId: 'Q1063',
  // },
  // {
  //   companyName: 'Fenix Outdoor Int.',
  //   klimatkollenWikidataId: 'Q10494668',
  //   firstSearchHitId: undefined,
  // },
  // {
  //   companyName: 'ICA Gruppen',
  //   klimatkollenWikidataId: 'Q1663776',
  //   firstSearchHitId: 'Q10516119',
  // },
  // {
  //   companyName: 'Lindab International',
  //   klimatkollenWikidataId: 'Q109773651',
  //   firstSearchHitId: undefined,
  // },
  // {
  //   companyName: 'Lundbergföretagen (koncern)',
  //   klimatkollenWikidataId: 'Q6460556',
  //   firstSearchHitId: undefined,
  // },
  {
    companyName: 'Lundin Mining Corp.',
    klimatkollenWikidataId: 'Q1537901',
    firstSearchHitId: 'Q137125375',
  },
  // {
  //   companyName: 'Mips',
  //   klimatkollenWikidataId: 'Q109787297',
  //   firstSearchHitId: 'Q1631366',
  // },
  // {
  //   companyName: 'SBB', // mkt svår kanske kan matcha rätt med beskrivning
  //   klimatkollenWikidataId: 'Q93559269',
  //   firstSearchHitId: 'Q7452767',
  // },
]

const SPECIAL_CASE_NAMES = new Set(
  LARGE_CAP_SEARCH_SPECIAL_CASES.map((c) => c.companyName)
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
).filter(([name]) => !SPECIAL_CASE_NAMES.has(name))

const casesThatFail: [string, string][] = [
  ['This is a non-existing company', 'Q100000000'],
]

describe('searchCompany (large cap)', () => {
  jest.setTimeout(60_000)

  // it.each(regularCases)('resolves "%s" to Wikidata id %s', async (name, id) => {
  //   const results = await searchCompany({ companyName: name })
  //   expect(results[0]?.id).toBe(id)
  // })

  it.each(LARGE_CAP_SEARCH_SPECIAL_CASES)(
    'special: $companyName — Klimatkollen $klimatkollenWikidataId, previous first hit $firstSearchHitId',
    async ({ companyName, klimatkollenWikidataId }) => {
      const results = await searchCompany({ companyName })
      expect(results[0]?.id).toBe(klimatkollenWikidataId)
    }
  )
})

/* 
Known issues:
- Unusual subclasses
  - "Sweco" is not a company, but an architectural firm. Other such special cases will probably occur in the future.
  - "SJ" is not a company, but a Swedish government agency.

- Naming
  - "OKQ8 Scandinavia" has to have Scandinavia removed from the name.
  - "Millicom Int. Cellular" has to have Int. removed from the name.

- Several entities with very similar names
  - "Lundin Mining Corp." and "Lundin Mining Corp. v. Markowich". We now prefer results that have industry prop set in Wikidata.
*/
