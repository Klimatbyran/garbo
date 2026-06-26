/**
 * Live Wikidata search specs call wbsearchentities and can fail when Wikidata changes.
 *
 * Tiers (set `WIKIDATA_LIVE_TESTS`):
 * - `smoke`  — a few companies per selected tag (default when running wikidata npm scripts)
 * - `regular` — all registry companies per tag, excluding documented gap buckets
 * - `fringe`  — only gap buckets (special / empty / impossible / wrongWinner)
 * - `all`     — regular + fringe
 *
 * Optional: `WIKIDATA_LIVE_TAGS=large-cap,baltics` to narrow tags.
 *
 * Default `npm test` skips live wikidata-search-company specs (see jest.config.js).
 */
export type WikidataLiveTier = 'smoke' | 'regular' | 'fringe' | 'all'

const SMOKE_TAGS = [
  'large-cap',
  'small-cap',
  'baltics',
] as const satisfies ReadonlyArray<string>

export const WIKIDATA_SMOKE_MAX_CASES_PER_TAG = 5

export function getWikidataLiveTier(): WikidataLiveTier | null {
  const raw = process.env.WIKIDATA_LIVE_TESTS?.trim().toLowerCase()
  if (!raw || raw === '0' || raw === 'false' || raw === 'off') return null
  if (raw === '1' || raw === 'true' || raw === 'all') return 'all'
  if (
    raw === 'smoke' ||
    raw === 'regular' ||
    raw === 'fringe' ||
    raw === 'all'
  ) {
    return raw
  }
  return null
}

export function shouldRunWikidataLiveSearchSpecs(): boolean {
  return getWikidataLiveTier() !== null
}

function enabledTags(): string[] | null {
  const raw = process.env.WIKIDATA_LIVE_TAGS?.trim()
  if (!raw) return null
  const tags = raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  return tags.length > 0 ? tags : null
}

export function isWikidataTagIncluded(tag: string): boolean {
  const only = enabledTags()
  if (only && !only.includes(tag)) return false

  const tier = getWikidataLiveTier()
  if (!tier) return false
  if (tier === 'smoke' && !(SMOKE_TAGS as readonly string[]).includes(tag))
    return false
  return true
}

export function shouldRunRegularSearchCases(tag: string): boolean {
  const tier = getWikidataLiveTier()
  if (!tier || tier === 'fringe') return false
  return isWikidataTagIncluded(tag)
}

export function shouldRunFringeSearchCases(tag: string): boolean {
  const tier = getWikidataLiveTier()
  if (!tier) return false
  if (tier !== 'fringe' && tier !== 'all') return false
  return isWikidataTagIncluded(tag)
}

export function sampleRegularCases<T>(cases: readonly T[]): T[] {
  const tier = getWikidataLiveTier()
  if (tier === 'smoke') {
    return cases.slice(0, WIKIDATA_SMOKE_MAX_CASES_PER_TAG)
  }
  return [...cases]
}
