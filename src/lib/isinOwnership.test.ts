import { describe, it, expect } from '@jest/globals'
import {
  decideIsinWrite,
  selectUniqueIsinForAutoWrite,
} from './isinOwnership'

const ISIN_A = 'SE0000108656'
const ISIN_B = 'DE0006047004'

describe('decideIsinWrite', () => {
  it('writes when the company has no ISIN and nobody else owns it', () => {
    expect(
      decideIsinWrite({
        companyId: 'company-1',
        existingIsin: null,
        incomingIsin: ISIN_A,
      })
    ).toEqual({
      action: 'write',
      reason: expect.stringContaining(ISIN_A),
    })
  })

  it('skips when the company already has the same ISIN', () => {
    expect(
      decideIsinWrite({
        companyId: 'company-1',
        existingIsin: ISIN_A,
        incomingIsin: ISIN_A,
      }).action
    ).toBe('skip')
  })

  it('does not auto-overwrite a different existing ISIN', () => {
    const result = decideIsinWrite({
      companyId: 'company-1',
      existingIsin: ISIN_A,
      incomingIsin: ISIN_B,
    })
    expect(result.action).toBe('skip')
    expect(result.reason).toMatch(/no auto-overwrite/i)
  })

  it('skips when another company already owns the incoming ISIN', () => {
    const result = decideIsinWrite({
      companyId: 'company-1',
      existingIsin: null,
      incomingIsin: ISIN_A,
      incomingIsinOwnerCompanyId: 'company-2',
    })
    expect(result.action).toBe('skip')
    expect(result.reason).toMatch(/already belongs to company company-2/)
  })
})

describe('selectUniqueIsinForAutoWrite', () => {
  it('returns the only valid ISIN', () => {
    expect(selectUniqueIsinForAutoWrite([ISIN_A])).toEqual({
      isin: ISIN_A,
      reason: expect.stringContaining(ISIN_A),
    })
  })

  it('returns null when zero or many valid ISINs', () => {
    expect(selectUniqueIsinForAutoWrite([]).isin).toBeNull()
    expect(selectUniqueIsinForAutoWrite([ISIN_A, ISIN_B]).isin).toBeNull()
    expect(selectUniqueIsinForAutoWrite(['bad', 'also-bad']).isin).toBeNull()
  })

  it('dedupes case variants of the same ISIN', () => {
    expect(
      selectUniqueIsinForAutoWrite(['se0000108656', 'SE0000108656']).isin
    ).toBe(ISIN_A)
  })
})
