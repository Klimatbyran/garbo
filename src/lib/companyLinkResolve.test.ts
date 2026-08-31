import { describe, it, expect } from '@jest/globals'
import {
  isLegalEntitySuffix,
  stripLegalEntitySuffixes,
} from './companyLegalEntitySuffixes'
import {
  assessCompanyLinkResolution,
  normalizeCompanyNameForMatch,
  pickExactNameMatches,
} from './companyLinkResolve'

describe('companyLegalEntitySuffixes', () => {
  it('recognizes Nordic and European legal forms', () => {
    expect(isLegalEntitySuffix('ASA')).toBe(true)
    expect(isLegalEntitySuffix('ASA.')).toBe(true)
    expect(isLegalEntitySuffix('GmbH')).toBe(true)
    expect(isLegalEntitySuffix('(AG)')).toBe(true)
    expect(isLegalEntitySuffix('S.A.')).toBe(true)
    expect(isLegalEntitySuffix('S.p.A.')).toBe(true)
    expect(isLegalEntitySuffix('SA')).toBe(true)
  })

  it('recognizes US and UK legal forms', () => {
    expect(isLegalEntitySuffix('Inc.')).toBe(true)
    expect(isLegalEntitySuffix('LLC')).toBe(true)
    expect(isLegalEntitySuffix('Corp')).toBe(true)
    expect(isLegalEntitySuffix('Ltd')).toBe(true)
    expect(isLegalEntitySuffix('PLC')).toBe(true)
  })

  it('does not treat ordinary words as suffixes', () => {
    expect(isLegalEntitySuffix('Laval')).toBe(false)
    expect(isLegalEntitySuffix('Group')).toBe(false)
  })
})

describe('companyLinkResolve', () => {
  it('normalizes names by stripping legal entity suffixes', () => {
    expect(normalizeCompanyNameForMatch('Example S.A.')).toBe('example')
    expect(normalizeCompanyNameForMatch('Alfa Laval AB')).toBe('alfa laval')
    expect(normalizeCompanyNameForMatch('Alfa Laval')).toBe('alfa laval')
    expect(normalizeCompanyNameForMatch('Equinor ASA')).toBe('equinor')
    expect(normalizeCompanyNameForMatch('Siemens AG')).toBe('siemens')
    expect(normalizeCompanyNameForMatch('Acme Corp.')).toBe('acme')
    expect(normalizeCompanyNameForMatch('Example LLC')).toBe('example')
    expect(normalizeCompanyNameForMatch('VOLVO A.B.')).toBe('volvo')
    expect(normalizeCompanyNameForMatch('Company A/S')).toBe('company')
    expect(stripLegalEntitySuffixes('Nokia Oyj')).toBe('Nokia')
  })

  it('resolves when exactly one candidate matches the normalized name', () => {
    const result = assessCompanyLinkResolution('Alfa Laval AB', [
      { id: 'alfa-1', name: 'Alfa Laval', wikidataId: 'Q686030' },
      { id: 'other', name: 'Other Co' },
    ])
    expect(result).toEqual({ action: 'resolve', companyId: 'alfa-1' })
  })

  it('sends alias-only exact hits to staff review (never auto-links)', () => {
    const candidates = [
      {
        id: 'volvo-1',
        name: 'Volvo Group',
        alternativeNames: ['Volvo AB', 'AB Volvo'],
      },
      { id: 'other', name: 'Other Co' },
    ]
    const result = assessCompanyLinkResolution('AB Volvo', candidates)
    expect(result).toEqual({
      action: 'ambiguous',
      candidates: [candidates[0]],
      matchedViaAlternativeName: true,
    })
  })

  it('still auto-resolves Volvo Cars via canonical name, not Volvo AB aliases', () => {
    const candidates = [
      {
        id: 'volvo-ab',
        name: 'Volvo AB',
        alternativeNames: ['AB Volvo'],
      },
      {
        id: 'volvo-cars',
        name: 'Volvo Cars',
      },
    ]
    const result = assessCompanyLinkResolution('Volvo Cars', candidates)
    expect(result).toEqual({
      action: 'resolve',
      companyId: 'volvo-cars',
    })
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
    expect(result).toEqual({
      action: 'ambiguous',
      candidates,
      partialNameMatch: true,
    })
  })

  it('creates a new company when search returns no candidates', () => {
    expect(assessCompanyLinkResolution('Brand New Co', [])).toEqual({
      action: 'create',
    })
  })

  it('flags ambiguity when only one fuzzy hit does not exactly match', () => {
    const candidates = [{ id: 'alfa-1', name: 'Alfa Laval' }]
    const result = assessCompanyLinkResolution(
      'Totally Different Name',
      candidates
    )
    expect(result).toEqual({ action: 'ambiguous', candidates })
    expect(
      pickExactNameMatches('Totally Different Name', candidates)
    ).toHaveLength(0)
  })
})
