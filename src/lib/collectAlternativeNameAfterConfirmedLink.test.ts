import { describe, expect, it } from '@jest/globals'
import { mergeAlternativeNames } from './companyAlternativeNames'

/**
 * Mirrors the merge decision used by collectAlternativeNameFromResolvedLink
 * without hitting the database.
 */
function wouldCollectAlternativeName(input: {
  canonicalName: string
  existingAlternativeNames: string[]
  extractedName: string
}): boolean {
  const existing = input.existingAlternativeNames
  const merged = mergeAlternativeNames({
    canonicalName: input.canonicalName,
    existingAlternativeNames: existing,
    incomingNames: [input.extractedName],
  })
  return !(
    merged.length === existing.length &&
    merged.every((name, index) => name === existing[index])
  )
}

describe('collectAlternativeNameAfterConfirmedLink merge decision', () => {
  it('collects a distinct trading name onto a confirmed company', () => {
    expect(
      wouldCollectAlternativeName({
        canonicalName: 'Volvo AB',
        existingAlternativeNames: [],
        extractedName: 'AB Volvo',
      })
    ).toBe(false)

    expect(
      wouldCollectAlternativeName({
        canonicalName: 'Volvo AB',
        existingAlternativeNames: [],
        extractedName: 'Volvo Group',
      })
    ).toBe(true)
  })

  it('does not collect when the extracted name is already stored', () => {
    expect(
      wouldCollectAlternativeName({
        canonicalName: 'Acme Corp',
        existingAlternativeNames: ['Acme Trading'],
        extractedName: 'Acme Trading',
      })
    ).toBe(false)
  })

  it('does not collect formatting variants of the canonical name', () => {
    expect(
      wouldCollectAlternativeName({
        canonicalName: 'Nestlé Sverige',
        existingAlternativeNames: [],
        extractedName: 'Nestle Sverige',
      })
    ).toBe(false)
  })
})
