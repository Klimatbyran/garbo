import { describe, it, expect } from '@jest/globals'
import { normalizeBic, isValidBic } from './normalizeBic'

describe('normalizeBic', () => {
  it('canonicalizes 8-char BICs to 11-char XXX form', () => {
    expect(normalizeBic('teersess')).toBe('TEERSESSXXX')
    expect(normalizeBic('TEERSESSXXX')).toBe('TEERSESSXXX')
  })

  it('rejects invalid values', () => {
    expect(normalizeBic('SHORT')).toBeNull()
    expect(normalizeBic('12345678')).toBeNull()
    expect(isValidBic('HCEMDE66XXX')).toBe(true)
  })
})
