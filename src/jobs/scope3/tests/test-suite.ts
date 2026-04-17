import type { TestSuite } from '../../promptTestingFramework/types'
import { expectedResults } from './expected-results'
import { prompt } from '../prompt'

import {
  schemaWithSubValuesForCategory,
  summarizePrompt,
  originalPrompt,
} from './testData'
import { schema } from '@/jobs/scope3/schema'

export const testSuite: TestSuite = {
  expectedResults,
  testVariations: [
    {
      name: 'new',
      prompt: summarizePrompt,
      schema: schemaWithSubValuesForCategory,
    },
  ],
}
