import type { TestSuite } from '../../promptTestingFramework/types'
import { newSchemaWithInstructionsArrayOfExplanations } from './testData'
import { expectedResults } from './expected-results'
import { prompt } from '../prompt'
import {
  BERGET_AI_BASE_URL,
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL,
  DEFAULT_TEMPERATURE,
} from '@/constants/ai'
import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  BERGET_AI_TOKEN: z.string(),
})

const parsedEnv = envSchema.safeParse(process.env)
const env = parsedEnv.data

export const testSuite: TestSuite = {
  expectedResults,
  askOptionsDefault: {
    model: DEFAULT_MODEL,
    temperature: DEFAULT_TEMPERATURE,
    max_tokens: DEFAULT_MAX_TOKENS,
  },
  testVariations: [
    {
      name: 'OpenAI gpt-4o Baseline',
      prompt,
      schema: newSchemaWithInstructionsArrayOfExplanations,
      baseline: true,
      // uses the default askOptions configured above.
    },
    {
      name: 'Berget AI Magistral Model',
      prompt,
      schema: newSchemaWithInstructionsArrayOfExplanations,
      askOptions: {
        baseUrl: BERGET_AI_BASE_URL,
        apiKey: env?.BERGET_AI_TOKEN,
        model: 'Magistral',
        temperature: 0.1,
        max_tokens: 4096,
      },
    },
  ],
}
