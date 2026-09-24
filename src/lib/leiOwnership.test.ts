import { describe, it, expect } from '@jest/globals'
import { decideLeiWrite } from './leiOwnership'

const LEI_A = '5493001KJTIIGC8Y1R12'
const LEI_B = '335800FVH4MOKZS9VH40'

describe('decideLeiWrite', () => {
  it('writes when the company has no LEI and nobody else owns it', () => {
    expect(
      decideLeiWrite({
        companyId: 'company-1',
        existingLei: null,
        incomingLei: LEI_A,
      })
    ).toEqual({
      action: 'write',
      reason: expect.stringContaining(LEI_A),
    })
  })

  it('skips when the company already has the same LEI', () => {
    const result = decideLeiWrite({
      companyId: 'company-1',
      existingLei: LEI_A,
      incomingLei: LEI_A,
    })
    expect(result.action).toBe('skip')
  })

  it('does not auto-overwrite a different existing LEI', () => {
    const result = decideLeiWrite({
      companyId: 'company-1',
      existingLei: LEI_A,
      incomingLei: LEI_B,
    })
    expect(result.action).toBe('skip')
    expect(result.reason).toMatch(/no auto-overwrite/i)
  })

  it('skips when another company already owns the incoming LEI', () => {
    const result = decideLeiWrite({
      companyId: 'company-1',
      existingLei: null,
      incomingLei: LEI_A,
      incomingLeiOwnerCompanyId: 'company-2',
    })
    expect(result.action).toBe('skip')
    expect(result.reason).toMatch(/already belongs to company company-2/)
  })

  it('writes when the owner of the incoming LEI is this company', () => {
    const result = decideLeiWrite({
      companyId: 'company-1',
      existingLei: null,
      incomingLei: LEI_A,
      incomingLeiOwnerCompanyId: 'company-1',
    })
    expect(result.action).toBe('write')
  })
})
