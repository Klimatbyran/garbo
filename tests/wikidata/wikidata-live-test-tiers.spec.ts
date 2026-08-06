import { afterEach, describe, expect, it } from '@jest/globals'
import {
  getWikidataLiveTier,
  isWikidataTagIncluded,
  sampleRegularCases,
  shouldRunFringeSearchCases,
  shouldRunRegularSearchCases,
  shouldRunWikidataLiveSearchSpecs,
} from './wikidata-live-test-tiers'

describe('wikidata-live-test-tiers', () => {
  const env = { ...process.env }

  afterEach(() => {
    process.env = { ...env }
  })

  it('defaults to off when WIKIDATA_LIVE_TESTS is unset', () => {
    delete process.env.WIKIDATA_LIVE_TESTS
    expect(getWikidataLiveTier()).toBeNull()
    expect(shouldRunWikidataLiveSearchSpecs()).toBe(false)
  })

  it('maps smoke tier to a subset of tags and regular cases', () => {
    process.env.WIKIDATA_LIVE_TESTS = 'smoke'
    expect(getWikidataLiveTier()).toBe('smoke')
    expect(isWikidataTagIncluded('large-cap')).toBe(true)
    expect(isWikidataTagIncluded('mid-cap')).toBe(false)
    expect(shouldRunRegularSearchCases('large-cap')).toBe(true)
    expect(shouldRunFringeSearchCases('large-cap')).toBe(false)
    expect(sampleRegularCases(['a', 'b', 'c', 'd', 'e', 'f'])).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
    ])
  })

  it('runs fringe-only cases on fringe tier', () => {
    process.env.WIKIDATA_LIVE_TESTS = 'fringe'
    expect(shouldRunRegularSearchCases('large-cap')).toBe(false)
    expect(shouldRunFringeSearchCases('large-cap')).toBe(true)
  })

  it('filters tags with WIKIDATA_LIVE_TAGS', () => {
    process.env.WIKIDATA_LIVE_TESTS = 'regular'
    process.env.WIKIDATA_LIVE_TAGS = 'baltics'
    expect(isWikidataTagIncluded('baltics')).toBe(true)
    expect(isWikidataTagIncluded('large-cap')).toBe(false)
  })
})
