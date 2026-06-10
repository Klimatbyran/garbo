import type { TestSuite } from '../../promptTestingFramework/types'
import { expectedResults } from './expected-results'
import { prompt } from '../prompt'
import { reportingQualitySchema } from '../schema'

export const testSuite: TestSuite = {
  expectedResults,
  testVariations: [
    {
      name: 'reporting quality flags',
      prompt,
      schema: reportingQualitySchema,
    },
  ],
}
