import { defineWikidataSearchTagSpec } from './wikidata-search-describe-by-tag'
import { WIKIDATA_SEARCH_GAP_CASES } from './gapCases'

defineWikidataSearchTagSpec({
  tag: 'large-cap',
  tagLabel: 'large cap',
  ...WIKIDATA_SEARCH_GAP_CASES['large-cap'],
})
