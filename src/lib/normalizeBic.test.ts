import { describe, it, expect } from '@jest/globals'
import { normalizeBic, isValidBic } from './normalizeBic'

describe('normalizeBic', () => {
  it('accepts 8- and 11-char BICs', () => {
    expect(normalizeBic('teersess')).toBe('TEERSESS')
    expect(normalizeBic('TEERSESSXXX')).toBe('TEERSESSXXX')
  })

  it('rejects invalid values', () => {
    expect(normalizeBic('SHORT')).toBeNull()
    expect(normalizeBic('12345678')).toBeNull()
    expect(isValidBic('HCEMDE66XXX')).toBe(true)
  })
})
