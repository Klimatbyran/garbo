import type { NamedWikidataCase } from './wikidata-search-helpers'
import { defineWikidataSearchTagSpec } from './wikidata-search-describe-by-tag'

const MID_CAP_SEARCH_SPECIAL_CASES: ReadonlyArray<NamedWikidataCase> = [
  { companyName: 'Arise', klimatkollenWikidataId: 'Q113465911' },
  { companyName: 'Garo', klimatkollenWikidataId: 'Q110086919' },
  { companyName: 'Humana', klimatkollenWikidataId: 'Q91016795' },
  { companyName: 'I.A.R Systems Group', klimatkollenWikidataId: 'Q1059840' },
  { companyName: 'OEM International', klimatkollenWikidataId: 'Q267558' },
  { companyName: 'Sedana Medical', klimatkollenWikidataId: 'Q38168829' },
  { companyName: 'Traction', klimatkollenWikidataId: 'Q106594863' },
  { companyName: 'Trianon', klimatkollenWikidataId: 'Q106594396' },
  { companyName: 'Öresund', klimatkollenWikidataId: 'Q6060751' },
]

const MID_CAP_SEARCH_EMPTY_RESULTS: ReadonlyArray<NamedWikidataCase> = [
  { companyName: 'Bactiguard Holding B', klimatkollenWikidataId: 'Q18287127' },
  {
    companyName: 'BioInvent International AB',
    klimatkollenWikidataId: 'Q117352880',
  },
  { companyName: 'Byggmax Group', klimatkollenWikidataId: 'Q10438182' },
  { companyName: 'Cavotec SA', klimatkollenWikidataId: 'Q5055199' },
  { companyName: 'Dustin Group AB', klimatkollenWikidataId: 'Q1141671' },
  { companyName: 'Dynavox Group', klimatkollenWikidataId: 'Q5318875' },
  { companyName: 'Harvia PLC', klimatkollenWikidataId: 'Q18681771' },
  {
    companyName: 'Lime Technologies AB (publ)',
    klimatkollenWikidataId: 'Q109780665',
  },
  { companyName: 'PowerCell Sweden', klimatkollenWikidataId: 'Q30292201' },
  { companyName: 'Profoto Holding', klimatkollenWikidataId: 'Q23044729' },
  {
    companyName: 'Swedish Logistic Property',
    klimatkollenWikidataId: 'Q131426217',
  },
  { companyName: 'XANO Industri', klimatkollenWikidataId: 'Q10720882' },
]

defineWikidataSearchTagSpec({
  tag: 'mid-cap',
  tagLabel: 'mid cap',
  specialCases: MID_CAP_SEARCH_SPECIAL_CASES,
  emptyResults: MID_CAP_SEARCH_EMPTY_RESULTS,
})
