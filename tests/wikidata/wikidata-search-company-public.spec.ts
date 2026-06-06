import type { NamedWikidataCase } from './wikidata-search-helpers'
import { defineWikidataSearchTagSpec } from './wikidata-search-describe-by-tag'

const PUBLIC_SEARCH_SPECIAL_CASES: ReadonlyArray<NamedWikidataCase> = [
  { companyName: 'Atria', klimatkollenWikidataId: 'Q11853290' },
]

const PUBLIC_SEARCH_EMPTY_RESULTS: ReadonlyArray<NamedWikidataCase> = [
  { companyName: 'Harvia PLC', klimatkollenWikidataId: 'Q18681771' },
  { companyName: 'HKFoods', klimatkollenWikidataId: 'Q139591851' },
  { companyName: 'Modulight Corporation', klimatkollenWikidataId: 'Q30285189' },
  { companyName: 'Norrhydro Group Plc', klimatkollenWikidataId: 'Q107548957' },
  { companyName: 'Olvi Group', klimatkollenWikidataId: 'Q4045735' },
]

defineWikidataSearchTagSpec({
  tag: 'public',
  tagLabel: 'public',
  specialCases: PUBLIC_SEARCH_SPECIAL_CASES,
  emptyResults: PUBLIC_SEARCH_EMPTY_RESULTS,
})
