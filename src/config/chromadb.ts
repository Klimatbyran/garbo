import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  CHROMA_HOST: z.string().default('http://127.0.0.1:8000'),
  CHROMA_TOKEN: z.string().optional(),
})

const env = envSchema.parse(process.env)

export default {
  path: env.CHROMA_HOST,
  auth: env.CHROMA_TOKEN
    ? {
        provider: 'token',
        credentials: env.CHROMA_TOKEN,
      }
    : undefined,
}
import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  CHROMA_HOST: z.string().default('http://127.0.0.1:8000'),
  CHROMA_TOKEN: z.string().optional(),
})

const env = envSchema.parse(process.env)

export default {
  path: env.CHROMA_HOST,
  auth: env.CHROMA_TOKEN
    ? {
        provider: 'token',
        credentials: env.CHROMA_TOKEN,
      }
    : undefined,
}
