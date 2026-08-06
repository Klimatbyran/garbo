import type { NamedWikidataCase } from './wikidata-search-helpers'

export type WikidataSearchGapBucket =
  | 'special'
  | 'empty'
  | 'impossible'
  | 'wrongWinner'

export type WikidataSearchGapCases = Readonly<{
  specialCases?: ReadonlyArray<NamedWikidataCase>
  emptyResults?: ReadonlyArray<NamedWikidataCase>
  impossibleToFind?: ReadonlyArray<NamedWikidataCase>
  wrongWinnerCases?: ReadonlyArray<NamedWikidataCase>
}>

/** Known search gaps per tag — single source for specs and gap-stats scripts. */
export const WIKIDATA_SEARCH_GAP_CASES = {
  'large-cap': {
    specialCases: [
      { companyName: 'Mips', klimatkollenWikidataId: 'Q109787297' },
      { companyName: 'SBB', klimatkollenWikidataId: 'Q93559269' },
    ],
    emptyResults: [],
  },
  'small-cap': {
    specialCases: [],
    impossibleToFind: [
      {
        companyName: 'HAKI Safety AB',
        klimatkollenWikidataId: 'Q10513026',
      },
      { companyName: 'MOMENT GROUP', klimatkollenWikidataId: 'Q10397256' },
    ],
    wrongWinnerCases: [
      { companyName: 'Concejo', klimatkollenWikidataId: 'Q138135784' },
      { companyName: 'Inission AB', klimatkollenWikidataId: 'Q138139493' },
      {
        companyName: 'Karnell Group AB',
        klimatkollenWikidataId: 'Q138140101',
      },
      { companyName: 'Mendus', klimatkollenWikidataId: 'Q138140858' },
      { companyName: 'Pierce Group AB', klimatkollenWikidataId: 'Q138141234' },
      { companyName: 'PION Group AB', klimatkollenWikidataId: 'Q138141573' },
      { companyName: 'Seafire', klimatkollenWikidataId: 'Q138143154' },
      {
        companyName: 'Wall to Wall Group AB',
        klimatkollenWikidataId: 'Q138144224',
      },
    ],
    emptyResults: [
      { companyName: 'Acrinova', klimatkollenWikidataId: 'Q138135683' },
      {
        companyName: 'B3 Consulting Group',
        klimatkollenWikidataId: 'Q137909059',
      },
      {
        companyName: 'Berner Industrier AB',
        klimatkollenWikidataId: 'Q138135718',
      },
      { companyName: 'EQL Pharma AB', klimatkollenWikidataId: 'Q137399896' },
      { companyName: 'Fastator', klimatkollenWikidataId: 'Q115168502' },
      { companyName: 'Nivika', klimatkollenWikidataId: 'Q134691493' },
      {
        companyName: 'Nordisk Bergteknik AB',
        klimatkollenWikidataId: 'Q138141068',
      },
      {
        companyName: 'Sivers Semiconductors',
        klimatkollenWikidataId: 'Q138143077',
      },
      { companyName: 'Stockwik', klimatkollenWikidataId: 'Q138142885' },
      { companyName: 'Vivesto', klimatkollenWikidataId: 'Q138145870' },
    ],
  },
  'mid-cap': {
    specialCases: [
      { companyName: 'Humana', klimatkollenWikidataId: 'Q91016795' },
    ],
    wrongWinnerCases: [
      { companyName: 'Sedana Medical', klimatkollenWikidataId: 'Q38168829' },
      { companyName: 'Traction', klimatkollenWikidataId: 'Q106594863' },
      { companyName: 'Trianon', klimatkollenWikidataId: 'Q106594396' },
      {
        companyName: 'Swedish Logistic Property',
        klimatkollenWikidataId: 'Q131426217',
      },
    ],
  },
  public: {
    emptyResults: [
      { companyName: 'HKFoods', klimatkollenWikidataId: 'Q139591851' },
    ],
  },
  baltics: {
    emptyResults: [
      {
        companyName: 'Aktsiaselts Infortar',
        klimatkollenWikidataId: 'Q25517692',
      },
    ],
    wrongWinnerCases: [
      { companyName: 'Hepsor AS', klimatkollenWikidataId: 'Q138573984' },
      { companyName: 'VILVI Group', klimatkollenWikidataId: 'Q4052700' },
    ],
  },
  'state-owned': {},
  private: {},
  'municipality-owned': {},
} as const satisfies Record<string, WikidataSearchGapCases>

export type ListedGapCase = Readonly<{
  name: string
  id: string
  tag: string
  bucket: WikidataSearchGapBucket
}>

const GAP_BUCKET_KEYS: ReadonlyArray<
  readonly [keyof WikidataSearchGapCases, WikidataSearchGapBucket]
> = [
  ['specialCases', 'special'],
  ['emptyResults', 'empty'],
  ['impossibleToFind', 'impossible'],
  ['wrongWinnerCases', 'wrongWinner'],
]

/** Flatten all documented gap cases for measurement scripts. */
export function listDocumentedGapCases(): ListedGapCase[] {
  const out: ListedGapCase[] = []
  for (const [tag, cases] of Object.entries(WIKIDATA_SEARCH_GAP_CASES)) {
    for (const [key, bucket] of GAP_BUCKET_KEYS) {
      const rows = cases[key]
      if (!rows) continue
      for (const row of rows) {
        out.push({
          name: row.companyName,
          id: row.klimatkollenWikidataId,
          tag,
          bucket,
        })
      }
    }
  }
  return out
}
