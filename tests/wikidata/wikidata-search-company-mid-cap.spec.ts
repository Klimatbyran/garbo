import type { NamedWikidataCase } from './wikidata-search-helpers'
import { defineWikidataSearchTagSpec } from './wikidata-search-describe-by-tag'

const MID_CAP_SEARCH_SPECIAL_CASES: ReadonlyArray<NamedWikidataCase> = [
  { companyName: 'Humana', klimatkollenWikidataId: 'Q91016795' },
]

const MID_CAP_SEARCH_WRONG_WINNER_CASES: ReadonlyArray<NamedWikidataCase> = [
  { companyName: 'Sedana Medical', klimatkollenWikidataId: 'Q38168829' },
  { companyName: 'Traction', klimatkollenWikidataId: 'Q106594863' },
  { companyName: 'Trianon', klimatkollenWikidataId: 'Q106594396' },
  {
    companyName: 'Swedish Logistic Property',
    klimatkollenWikidataId: 'Q131426217',
  },
]

defineWikidataSearchTagSpec({
  tag: 'mid-cap',
  tagLabel: 'mid cap',
  specialCases: MID_CAP_SEARCH_SPECIAL_CASES,
  wrongWinnerCases: MID_CAP_SEARCH_WRONG_WINNER_CASES,
})
