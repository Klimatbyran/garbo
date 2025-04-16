import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  GOOGLE_API_KEY: z.string().optional(),
  GOOGLE_SEARCH_ENGINE_ID: z.string().optional(),
})

const env = envSchema.parse(process.env)

export default {
  apiKey: env.GOOGLE_API_KEY,
  searchEngineId: env.GOOGLE_SEARCH_ENGINE_ID,
  isConfigured: Boolean(env.GOOGLE_API_KEY && env.GOOGLE_SEARCH_ENGINE_ID),
}
