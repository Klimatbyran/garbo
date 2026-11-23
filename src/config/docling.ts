import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  /**
   * Docling API base URL, including `/v1`. Health is checked at `/health` on
   * the same host. Defaults to a local docling-serve.
   */
  DOCLING_URL: z.string().optional().default('http://localhost:5001/v1'),
  /**
   * Sent as `Authorization: Bearer <token>` when set. Leave empty for a
   * local Docling without auth.
   */
  DOCLING_API_TOKEN: z.string().optional().default(''),
})

const parsedEnv = envSchema.safeParse(process.env)
if (!parsedEnv.success) {
  console.error('❌ Invalid Docling environment configuration:')
  console.error(parsedEnv.error.format())
  throw new Error('Invalid Docling environment configuration')
}

export default {
  baseUrl: parsedEnv.data.DOCLING_URL.replace(/\/+$/, ''),
  apiToken: parsedEnv.data.DOCLING_API_TOKEN,
}
