import { detailedCompanyArgs, pipelineCompanyDetailArgs } from '../src/api/args'
import { GoalSchema, InternalGoalSchema } from '../src/api/schemas/response'

const CLASSIFICATION_KEYS = [
  'originalQuote',
  'targetType',
  'targetDirection',
  'unit',
  'intensityMetric',
  'horizon',
  'isSbtiTarget',
  'baseYearSource',
] as const

describe('goal classification partner isolation', () => {
  it('keeps GoalSchema on the legacy partner shape', () => {
    const keys = Object.keys(GoalSchema.shape)
    for (const key of CLASSIFICATION_KEYS) {
      expect(keys).not.toContain(key)
    }
    expect(keys).toEqual(
      expect.arrayContaining([
        'id',
        'description',
        'year',
        'baseYear',
        'target',
        'reportId',
        'metadata',
      ])
    )
  })

  it('exposes classification only on InternalGoalSchema', () => {
    const keys = Object.keys(InternalGoalSchema.shape)
    for (const key of CLASSIFICATION_KEYS) {
      expect(keys).toContain(key)
    }
  })

  it('does not select classification columns for partner detailedCompanyArgs', () => {
    const select = detailedCompanyArgs.select.goals.select
    for (const key of CLASSIFICATION_KEYS) {
      expect(select).not.toHaveProperty(key)
    }
  })

  it('selects classification columns for pipeline company detail', () => {
    const select = pipelineCompanyDetailArgs.select.goals.select
    for (const key of CLASSIFICATION_KEYS) {
      expect(select).toHaveProperty(key)
    }
  })

  it('parses a legacy goal without classification through GoalSchema', () => {
    const parsed = GoalSchema.parse({
      id: 'g1',
      description: 'Net zero',
      year: '2030',
      baseYear: '2019',
      target: 50,
      reportId: null,
      metadata: null,
      // Extra keys must not become part of the partner contract shape.
      originalQuote: 'should be stripped',
      targetType: 'ABSOLUTE',
    })
    expect(parsed).not.toHaveProperty('originalQuote')
    expect(parsed).not.toHaveProperty('targetType')
  })
})
