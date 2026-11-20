import { describe, it, expect, jest } from '@jest/globals'

jest.unstable_mockModule('./openai', () => ({
  askPrompt: jest.fn(async () => 'NO_CHANGES'),
}))

jest.unstable_mockModule('../config/api', () => ({
  default: { frontendURL: 'https://example.test' },
}))

const { hasDeterministicChanges, diffChanges } = await import('./saveUtils')

describe('hasDeterministicChanges / diffChanges', () => {
  it('detects real value changes ignoring metadata', () => {
    expect(
      hasDeterministicChanges(
        { total: 1, metadata: { a: 1 } },
        { total: 2, metadata: { a: 9 } }
      )
    ).toBe(true)
    expect(
      hasDeterministicChanges(
        { total: 1, metadata: { a: 1 } },
        { total: 1, metadata: { a: 9 } }
      )
    ).toBe(false)
  })

  it('still saves a readable diff when the LLM says NO_CHANGES', async () => {
    const result = await diffChanges({
      existingCompany: { id: 'c1' },
      before: { total: 1 },
      after: { total: 2 },
    })
    expect(result.requiresApproval).toBe(true)
    expect(result.diff).toContain('Detected structured data changes')
  })
})
