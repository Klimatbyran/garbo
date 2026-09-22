import 'dotenv/config'
import type { TestSuite } from '../../promptTestingFramework/types'
import { expectedResults } from './expected-results'
import { prompt } from '../prompt'
import { schema } from '../schema'

export const testSuite: TestSuite = {
  expectedResults,
  testVariations: [
    {
      name: 'OpenAI gpt-4o baseline',
      prompt,
      schema,
      baseline: true,
    },
    {
      name: 'Berget Mistral-Medium-3.5',
      prompt,
      schema,
      askOptions: {
        baseURL: 'https://api.berget.ai/v1',
        apiKey: process.env.BERGET_AI_TOKEN,
        model: 'mistralai/Mistral-Medium-3.5-128B',
      },
    },
  ],
}
