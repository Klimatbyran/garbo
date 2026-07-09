import type { SearchResult } from 'wikibase-sdk'

export const WIKIDATA_SEARCH_TOP_N = 10

export type SearchHitStatus = 'top' | 'low' | 'empty'

export type GapRecoveryStatus =
  'still_empty' | 'now_top' | 'now_low' | 'still_missing'

export function classifySearchHit(
  results: SearchResult[],
  expectedId: string,
  topN = WIKIDATA_SEARCH_TOP_N
): SearchHitStatus {
  if (results.length === 0) return 'empty'
  const topIds = results.slice(0, topN).map((r) => r.id)
  if (topIds.includes(expectedId)) return 'top'
  if (results.some((r) => r.id === expectedId)) return 'low'
  return 'empty'
}

export function classifyGapRecovery(
  results: SearchResult[],
  expectedId: string,
  topN = WIKIDATA_SEARCH_TOP_N
): GapRecoveryStatus {
  if (results.length === 0) return 'still_empty'
  const topIds = results.slice(0, topN).map((r) => r.id)
  if (topIds.includes(expectedId)) return 'now_top'
  if (results.some((r) => r.id === expectedId)) return 'now_low'
  return 'still_missing'
}
