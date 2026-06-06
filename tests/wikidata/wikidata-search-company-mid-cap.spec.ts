import { defineWikidataSearchTagSpec } from './wikidata-search-describe-by-tag'
import { WIKIDATA_SEARCH_GAP_CASES } from './gapCases'

defineWikidataSearchTagSpec({
  tag: 'mid-cap',
  tagLabel: 'mid cap',
  ...WIKIDATA_SEARCH_GAP_CASES['mid-cap'],
})
