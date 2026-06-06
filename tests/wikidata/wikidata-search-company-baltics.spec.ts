import { defineWikidataSearchTagSpec } from './wikidata-search-describe-by-tag'
import { WIKIDATA_SEARCH_GAP_CASES } from './gapCases'

defineWikidataSearchTagSpec({
  tag: 'baltics',
  tagLabel: 'baltics',
  ...WIKIDATA_SEARCH_GAP_CASES.baltics,
})
