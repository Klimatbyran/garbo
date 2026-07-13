import { describe, it, expect } from '@jest/globals'
import {
  assessCompanyLinkResolution,
  normalizeCompanyNameForMatch,
  pickExactNameMatches,
} from './companyLinkResolve'

describe('companyLinkResolve', () => {
  it('normalizes names by stripping legal entity suffixes', () => {
    expect(normalizeCompanyNameForMatch('Alfa Laval AB')).toBe('alfa laval')
    expect(normalizeCompanyNameForMatch('Alfa Laval')).toBe('alfa laval')
  })

  it('resolves when exactly one candidate matches the normalized name', () => {
    const result = assessCompanyLinkResolution('Alfa Laval AB', [
      { id: 'alfa-1', name: 'Alfa Laval', wikidataId: 'Q686030' },
      { id: 'other', name: 'Other Co' },
    ])
    expect(result).toEqual({ action: 'resolve', companyId: 'alfa-1' })
  })

  it('flags ambiguity when multiple candidates share the normalized name', () => {
    const candidates = [
      { id: 'alfa-1', name: 'Alfa Laval', wikidataId: 'Q686030' },
      { id: 'alfa-2', name: 'Alfa Laval', wikidataId: 'Q686030' },
    ]
    const result = assessCompanyLinkResolution('Alfa Laval', candidates)
    expect(result).toEqual({ action: 'ambiguous', candidates })
  })

  it('flags ambiguity when several fuzzy hits exist without a single exact match', () => {
    const candidates = [
      { id: 'ica-se', name: 'ICA Gruppen AB' },
      { id: 'ica-no', name: 'ICA Norge AS' },
    ]
    const result = assessCompanyLinkResolution('ICA', candidates)
    expect(result).toEqual({ action: 'ambiguous', candidates })
  })

  it('creates a new company when search returns no candidates', () => {
    expect(assessCompanyLinkResolution('Brand New Co', [])).toEqual({
      action: 'create',
    })
  })

  it('creates a new company when only one fuzzy hit does not exactly match', () => {
    const result = assessCompanyLinkResolution('Totally Different Name', [
      { id: 'alfa-1', name: 'Alfa Laval' },
    ])
    expect(result).toEqual({ action: 'create' })
    expect(
      pickExactNameMatches('Totally Different Name', [
        { id: 'alfa-1', name: 'Alfa Laval' },
      ])
    ).toHaveLength(0)
  })
})
