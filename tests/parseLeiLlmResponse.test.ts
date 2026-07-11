import { parseLeiLlmResponse } from '../src/prompts/lei'

describe('parseLeiLlmResponse', () => {
  it('parses valid LEI JSON', () => {
    const result = parseLeiLlmResponse(
      JSON.stringify({
        lei: '12345678901234567890',
        legalName: 'Example AB',
      })
    )

    expect(result).toEqual({
      success: true,
      data: {
        lei: '12345678901234567890',
        legalName: 'Example AB',
      },
    })
  })

  it('returns an error for non-JSON LLM responses', () => {
    const result = parseLeiLlmResponse(
      'You are sending too many requests. Please try again later.'
    )

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/Invalid JSON response/)
    }
  })

  it('returns an error when required fields are missing', () => {
    const result = parseLeiLlmResponse(JSON.stringify({ lei: '123' }))

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.length).toBeGreaterThan(0)
    }
  })
})
