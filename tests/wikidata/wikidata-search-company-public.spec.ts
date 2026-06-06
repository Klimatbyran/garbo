import type { NamedWikidataCase } from './wikidata-search-helpers'
import { defineWikidataSearchTagSpec } from './wikidata-search-describe-by-tag'

const PUBLIC_SEARCH_EMPTY_RESULTS: ReadonlyArray<NamedWikidataCase> = [
  { companyName: 'HKFoods', klimatkollenWikidataId: 'Q139591851' },
]

defineWikidataSearchTagSpec({
  tag: 'public',
  tagLabel: 'public',
  emptyResults: PUBLIC_SEARCH_EMPTY_RESULTS,
})
