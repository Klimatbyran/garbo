import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  OPENAI_API_KEY: z.string(),
  OPENAI_ORG_ID: z.string(),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid initialization of OpenAI environment variables:')
  console.error(parsedEnv.error.format())

  if (parsedEnv.error.errors.some((err) => err.path[0] === 'OPENAI_API_KEY')) {
    console.error('OPENAI_API_KEY must be a key in the form of a string.')
    console.error(
      'Please ask another member for the key if you did not receive it yet'
    )
  }

  if (parsedEnv.error.errors.some((err) => err.path[0] === 'OPENAI_ORG_ID')) {
    console.error('OPENAI_ORG_ID must be an ID in the form of a string.')
  }

  throw new Error('Invalid initialization of OpenAI environment variables')
}

const env = parsedEnv.data

export default {
  // Used by the `OpenAIEmbeddingFunction` from `chromadb`:
  openai_api_key: env.OPENAI_API_KEY,
  openai_organization_id: env.OPENAI_ORG_ID,

  // Used by the `openai` Node.js API:
  organization: env.OPENAI_ORG_ID,
  apiKey: env.OPENAI_API_KEY,
}
