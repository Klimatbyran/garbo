import { describe, expect, it } from '@jest/globals'
import {
  isFormattingVariantOfCompanyName,
  mergeAlternativeNames,
} from './companyAlternativeNames'
import { companyNameMatchKey } from './companyLinkResolve'

describe('companyNameMatchKey', () => {
  it('folds case, spaces, periods, and legal suffixes', () => {
    expect(companyNameMatchKey('Volvo AB')).toBe('volvo')
    expect(companyNameMatchKey('VOLVO  A.B.')).toBe('volvo')
    expect(companyNameMatchKey('AB Volvo')).toBe('volvo')
    expect(companyNameMatchKey('  Volvo,   AB ')).toBe('volvo')
  })

  it('keeps significant tokens so brand-family entities stay distinct', () => {
    expect(companyNameMatchKey('Volvo AB')).toBe('volvo')
    expect(companyNameMatchKey('Volvo Cars')).toBe('volvo cars')
    expect(companyNameMatchKey('Volvo AB')).not.toBe(
      companyNameMatchKey('Volvo Cars')
    )
  })

  it('folds diacritics and ampersands', () => {
    expect(companyNameMatchKey('Nestlé Sverige')).toBe('nestle sverige')
    expect(companyNameMatchKey('H&M')).toBe('h m')
    expect(companyNameMatchKey('H & M')).toBe('h m')
  })

  it('strips Nordic slash-form legal suffixes (A/S, AS/A)', () => {
    expect(companyNameMatchKey('Company A/S')).toBe('company')
    expect(companyNameMatchKey('Equinor A/S')).toBe('equinor')
    expect(companyNameMatchKey('Foo AS/A')).toBe('foo')
  })

  it('normalizes hyphens so spacing variants share a key', () => {
    expect(companyNameMatchKey('Coca-Cola')).toBe('coca cola')
    expect(companyNameMatchKey('Coca - Cola')).toBe('coca cola')
  })
})

describe('mergeAlternativeNames', () => {
  it('dedupes formatting variants and drops the canonical name', () => {
    expect(
      mergeAlternativeNames({
        canonicalName: 'Volvo AB',
        existingAlternativeNames: ['VOLVO  A.B.', 'Ab Volvo'],
        incomingNames: ['volvo ab', 'Volvo Group'],
      })
    ).toEqual(['Volvo Group'])
  })

  it('keeps distinct significant-token names (Volvo Cars ≠ Volvo AB)', () => {
    expect(
      mergeAlternativeNames({
        canonicalName: 'Volvo AB',
        incomingNames: ['Volvo Cars', 'AB Volvo'],
      })
    ).toEqual(['Volvo Cars'])
  })

  it('prefers the richer diacritic display form for the same key', () => {
    expect(
      mergeAlternativeNames({
        canonicalName: 'Other Co',
        existingAlternativeNames: ['Nestle Sverige'],
        incomingNames: ['Nestlé Sverige'],
      })
    ).toEqual(['Nestlé Sverige'])
  })

  it('trims empties and ignores blank incoming values', () => {
    expect(
      mergeAlternativeNames({
        canonicalName: 'Acme',
        existingAlternativeNames: ['', '  '],
        incomingNames: [' Acme Trading ', ''],
      })
    ).toEqual(['Acme Trading'])
  })
})

describe('isFormattingVariantOfCompanyName', () => {
  it('treats punctuation and suffix-only differences as formatting variants', () => {
    expect(isFormattingVariantOfCompanyName('Volvo AB', 'AB Volvo')).toBe(true)
    expect(isFormattingVariantOfCompanyName('Volvo AB', 'VOLVO A.B.')).toBe(true)
  })

  it('does not treat Volvo Cars as a formatting variant of Volvo AB', () => {
    expect(isFormattingVariantOfCompanyName('Volvo AB', 'Volvo Cars')).toBe(
      false
    )
  })
})
