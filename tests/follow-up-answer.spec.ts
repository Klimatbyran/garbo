import { parseFollowUpAnswer } from '../src/lib/parseFollowUpAnswer'

describe('parseFollowUpAnswer', () => {
  test('unwraps value from followUp JSON string', () => {
    const answer = JSON.stringify({
      value: { reportType: 'sustainability-report' },
      metadata: { prompt: 'test' },
    })

    expect(parseFollowUpAnswer(answer)).toEqual({
      reportType: 'sustainability-report',
    })
  })

  test('returns null for missing or invalid answers', () => {
    expect(parseFollowUpAnswer(undefined)).toBeNull()
    expect(parseFollowUpAnswer('not-json')).toBeNull()
    expect(parseFollowUpAnswer(JSON.stringify({ metadata: {} }))).toBeNull()
  })

  test('does not treat a raw string as having reportType', () => {
    const wrapped = JSON.stringify({
      value: { reportType: 'annual-report' },
      metadata: {},
    })

    expect((wrapped as { reportType?: string }).reportType).toBeUndefined()
    expect(parseFollowUpAnswer(wrapped)?.reportType).toBe('annual-report')
  })
})
