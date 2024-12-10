import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NLM_INGESTOR_URL: z.string().default('http://0.0.0.0:5001'),
})

export const env = envSchema.parse(process.env)

export default {
  url: env.NLM_INGESTOR_URL,
}
