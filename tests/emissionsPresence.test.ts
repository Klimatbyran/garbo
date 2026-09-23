import { describe, expect, it } from '@jest/globals'
import { detectEmissionsPresence } from '../src/lib/emissionsPresence'

describe('detectEmissionsPresence', () => {
  it('returns false for empty markdown', () => {
    expect(detectEmissionsPresence('')).toEqual({
      hasEmissionsMentions: false,
      matchedTerms: [],
    })
    expect(detectEmissionsPresence(null)).toEqual({
      hasEmissionsMentions: false,
      matchedTerms: [],
    })
  })

  it('detects spaced and compact scope labels', () => {
    const result = detectEmissionsPresence(
      'Our Scope 1 was 10 tCO2e. Scope2 market-based and scope3 categories follow.'
    )
    expect(result.hasEmissionsMentions).toBe(true)
    expect(result.matchedTerms).toEqual(
      expect.arrayContaining(['scope 1', 'scope 2', 'scope 3'])
    )
  })

  it('detects scope ranges and lists', () => {
    expect(
      detectEmissionsPresence('GHG inventory covers Scope 1-3 emissions.')
        .hasEmissionsMentions
    ).toBe(true)
    expect(
      detectEmissionsPresence('We report scopes 1, 2 and 3 separately.')
        .hasEmissionsMentions
    ).toBe(true)
    expect(
      detectEmissionsPresence('Vi rapporterar scopes 1, 2 och 3.').hasEmissionsMentions
    ).toBe(true)
  })

  it('detects roman numeral scopes', () => {
    const result = detectEmissionsPresence('Scope I / Scope II / Scope III')
    expect(result.hasEmissionsMentions).toBe(true)
    expect(result.matchedTerms).toEqual(
      expect.arrayContaining(['scope I', 'scope II', 'scope III'])
    )
  })

  it('does not match unrelated text without scope language', () => {
    expect(
      detectEmissionsPresence(
        'This municipal climate plan describes adaptation measures and trees.'
      ).hasEmissionsMentions
    ).toBe(false)
  })
})
