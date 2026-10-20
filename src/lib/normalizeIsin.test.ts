import { describe, it, expect } from '@jest/globals'
import {
  isValidIsin,
  normalizeIsin,
  requireNormalizedIsin,
} from './normalizeIsin'

describe('normalizeIsin', () => {
  it('accepts known valid ISINs', () => {
    expect(normalizeIsin('SE0000108656')).toBe('SE0000108656')
    expect(normalizeIsin('de0006047004')).toBe('DE0006047004')
    expect(normalizeIsin(' US0378331005 ')).toBe('US0378331005')
  })

  it('rejects wrong length, format, or checksum', () => {
    expect(normalizeIsin('SE000010865')).toBeNull()
    expect(normalizeIsin('SE0000108657')).toBeNull()
    expect(normalizeIsin('123456789012')).toBeNull()
    expect(normalizeIsin('')).toBeNull()
    expect(normalizeIsin(null)).toBeNull()
  })

  it('isValidIsin matches normalizeIsin success', () => {
    expect(isValidIsin('GB0002374006')).toBe(true)
    expect(isValidIsin('GB0002374007')).toBe(false)
  })

  it('requireNormalizedIsin throws 400 on invalid', () => {
    expect(() => requireNormalizedIsin('not-an-isin')).toThrow(/Invalid ISIN/)
    try {
      requireNormalizedIsin('not-an-isin')
    } catch (error) {
      expect((error as { code?: number }).code).toBe(400)
    }
  })
})
