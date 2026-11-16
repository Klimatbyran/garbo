import { describe, it, expect } from '@jest/globals'
import { hasLegacyRepeatableKeyShape } from './bullmqLegacyRepeatableKey'

describe('hasLegacyRepeatableKeyShape', () => {
  it('matches legacy name:id:endDate:tz:every keys', () => {
    // name:id:endDate:tz:every — empty id/endDate/tz, numeric every
    expect(hasLegacyRepeatableKeyShape('tick::::60000')).toBe(true)
    expect(hasLegacyRepeatableKeyShape('tick:abc::UTC:60000')).toBe(true)
  })

  it('matches legacy cron-pattern keys (space in suffix)', () => {
    expect(hasLegacyRepeatableKeyShape('sweep::::0 * * * *')).toBe(true)
  })

  it('rejects v6 job scheduler ids', () => {
    expect(hasLegacyRepeatableKeyShape('pipeline-auto-run-tick')).toBe(false)
    expect(hasLegacyRepeatableKeyShape('chroma-sweep')).toBe(false)
  })

  it('rejects v6 delayed job suffixes under a scheduler id', () => {
    // Full redis key suffix after bull:<queue>:repeat: for a delayed job is
    // `<schedulerId>:<millis>` — only two segments, not legacy shape.
    expect(
      hasLegacyRepeatableKeyShape('pipeline-auto-run-tick:1710000000000')
    ).toBe(false)
  })
})
