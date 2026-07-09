import { describe, expect, it } from '@jest/globals'
import { lookupKnownCompanyWikidataIdFromRegistry } from '../src/lib/wikidata/knownCompanyLookup'

describe('lookupKnownCompanyWikidataIdFromRegistry', () => {
  it('returns the bundled Wikidata id for an exact Klimatkollen name', () => {
    expect(lookupKnownCompanyWikidataIdFromRegistry('AAK')).toBe('Q10397786')
  })

  it('matches case-insensitively', () => {
    expect(lookupKnownCompanyWikidataIdFromRegistry('aak')).toBe('Q10397786')
  })

  it('returns null for unknown companies', () => {
    expect(
      lookupKnownCompanyWikidataIdFromRegistry(
        'Definitely Not A Real Company XYZ'
      )
    ).toBeNull()
  })

  it('resolves Oncopeptides from the bundled registry', () => {
    expect(lookupKnownCompanyWikidataIdFromRegistry('Oncopeptides')).toBe(
      'Q138144442'
    )
  })
})
