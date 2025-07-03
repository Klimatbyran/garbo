import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  OPENAI_API_KEY: z.string(),
  OPENAI_ORG_ID: z.string(),
})

const env = envSchema.parse(process.env)

export default {
  // Used by the `OpenAIEmbeddingFunction` from `chromadb`:
  openai_api_key: env.OPENAI_API_KEY,
  openai_organization_id: env.OPENAI_ORG_ID,

  // Used by the `openai` Node.js API:
  organization: env.OPENAI_ORG_ID,
  apiKey: env.OPENAI_API_KEY,
}
