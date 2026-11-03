import {
  parseFollowUpAnswer,
  withFollowUpValue,
} from '../src/lib/parseFollowUpAnswer'

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

describe('withFollowUpValue', () => {
  test('replaces the value and keeps the metadata, model included', () => {
    const answer = JSON.stringify({
      value: { reportType: ' annual-report ' },
      metadata: { prompt: 'test', aiDurationMs: 12, model: 'gpt-4.1' },
    })

    const result = withFollowUpValue(answer, { reportType: 'annual-report' })

    expect(JSON.parse(result)).toEqual({
      value: { reportType: 'annual-report' },
      metadata: { prompt: 'test', aiDurationMs: 12, model: 'gpt-4.1' },
    })
    expect(parseFollowUpAnswer(result)).toEqual({
      reportType: 'annual-report',
    })
  })

  test('wraps the value when there is no answer', () => {
    expect(
      JSON.parse(withFollowUpValue(undefined, { reportType: null }))
    ).toEqual({ value: { reportType: null } })
  })

  test('throws on an answer that is not JSON instead of dropping metadata', () => {
    expect(() => withFollowUpValue('not-json', { reportType: null })).toThrow(
      SyntaxError
    )
  })
})
