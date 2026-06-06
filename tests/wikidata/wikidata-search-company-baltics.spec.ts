import type { NamedWikidataCase } from './wikidata-search-helpers'
import { defineWikidataSearchTagSpec } from './wikidata-search-describe-by-tag'

const BALTICS_SEARCH_EMPTY_RESULTS: ReadonlyArray<NamedWikidataCase> = [
  { companyName: 'Aktsiaselts Infortar', klimatkollenWikidataId: 'Q25517692' },
]

const BALTICS_SEARCH_WRONG_WINNER_CASES: ReadonlyArray<NamedWikidataCase> = [
  { companyName: 'Hepsor AS', klimatkollenWikidataId: 'Q138573984' },
  { companyName: 'VILVI Group', klimatkollenWikidataId: 'Q4052700' },
]

defineWikidataSearchTagSpec({
  tag: 'baltics',
  tagLabel: 'baltics',
  emptyResults: BALTICS_SEARCH_EMPTY_RESULTS,
  wrongWinnerCases: BALTICS_SEARCH_WRONG_WINNER_CASES,
})
