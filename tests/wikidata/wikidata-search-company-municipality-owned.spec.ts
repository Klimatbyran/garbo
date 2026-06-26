import { defineWikidataSearchTagSpec } from './wikidata-search-describe-by-tag'

/**
 * No companies in `klimatkollen-company-wikidata.json` carry `municipality-owned` yet.
 * This spec is a placeholder so the tag stays covered when rows are added.
 */
defineWikidataSearchTagSpec({
  tag: 'municipality-owned',
  tagLabel: 'municipality owned',
})
