import { defineWikidataSearchTagSpec } from './wikidata-search-describe-by-tag'
import { WIKIDATA_SEARCH_GAP_CASES } from './gapCases'

defineWikidataSearchTagSpec({
  tag: 'public',
  tagLabel: 'public',
  ...WIKIDATA_SEARCH_GAP_CASES.public,
})
