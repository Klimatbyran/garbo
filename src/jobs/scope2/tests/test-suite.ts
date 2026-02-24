import { z } from 'zod'
import type { TestSuite } from '../../promptTestingFramework/types'
import { expectedResults } from './expected-results'
import { prompt } from '../prompt'
import { schema } from '../schema'

export const testSuite: TestSuite = {
  expectedResults,
  testVariations: [
    {
      name: 'scope 2 only',
      prompt: prompt,
      schema: schema,
    },
  ],
}
