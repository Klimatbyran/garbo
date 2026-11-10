import { describe, expect, it } from '@jest/globals'
import {
  companyNameSearchPatterns,
  escapeIlikePattern,
} from './escapeIlikePattern'

describe('escapeIlikePattern', () => {
  it('escapes LIKE metacharacters', () => {
    expect(escapeIlikePattern('100%_done')).toBe('100\\%\\_done')
    expect(escapeIlikePattern('a\\b')).toBe('a\\\\b')
  })

  it('leaves ordinary punctuation alone', () => {
    expect(escapeIlikePattern('at&t')).toBe('at&t')
    expect(escapeIlikePattern('acme (sweden)')).toBe('acme (sweden)')
  })
})

describe('companyNameSearchPatterns', () => {
  it('builds prefix and contains patterns with escapes', () => {
    expect(companyNameSearchPatterns('xx')).toEqual({
      prefixPattern: 'xx%',
      containsPattern: '%xx%',
    })
    expect(companyNameSearchPatterns('100%')).toEqual({
      prefixPattern: '100\\%%',
      containsPattern: '%100\\%%',
    })
  })
})
