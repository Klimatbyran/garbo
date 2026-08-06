import { describe, it, expect } from '@jest/globals'
import { normalizeLei, isLeiFormat } from './normalizeLei'

describe('normalizeLei', () => {
  it('accepts a valid 20-character LEI', () => {
    expect(normalizeLei('5493001KJTIIGC8Y1R12')).toBe('5493001KJTIIGC8Y1R12')
    expect(normalizeLei('  5493001kjtiigc8y1r12  ')).toBe(
      '5493001KJTIIGC8Y1R12'
    )
  })

  it('rejects invalid LEI values', () => {
    expect(normalizeLei('')).toBeNull()
    expect(normalizeLei('too-short')).toBeNull()
    expect(normalizeLei(undefined)).toBeNull()
  })

  it('detects LEI format', () => {
    expect(isLeiFormat('5493001KJTIIGC8Y1R12')).toBe(true)
    expect(isLeiFormat('not-a-lei')).toBe(false)
  })
})
