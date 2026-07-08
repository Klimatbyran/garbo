import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  PIPELINE_API_URL: z.string().url().optional(),
  INTERNAL_SERVICE_TOKEN: z.string().optional(),
})

const parsedEnv = envSchema.safeParse(process.env)
const env = parsedEnv.success ? parsedEnv.data : {}

export default {
  baseUrl: env.PIPELINE_API_URL?.replace(/\/$/, ''),
  internalServiceToken: env.INTERNAL_SERVICE_TOKEN,
}
