import { defineWikidataSearchTagSpec } from './wikidata-search-describe-by-tag'
import { WIKIDATA_SEARCH_GAP_CASES } from './gapCases'

defineWikidataSearchTagSpec({
  tag: 'small-cap',
  tagLabel: 'small cap',
  ...WIKIDATA_SEARCH_GAP_CASES['small-cap'],
})
