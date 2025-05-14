import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  CHROMA_HOST: z.string().default('http://127.0.0.1:8000'),
  CHROMA_TOKEN: z.string().optional(),
  CHUNK_SIZE: z.number().default(2000),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid initialization of ChromaDB environment variables:')
  console.error(parsedEnv.error.format())

  if (parsedEnv.error.errors.some(err => err.path[0] === 'CHROMA_TOKEN')) {
    console.error('CHROMA_TOKEN must be a key in the format of a string.');
  }

  throw new Error('Invalid initialization of ChromaDB environment variables')
}

const env = parsedEnv.data

export default {
  path: env.CHROMA_HOST,
  auth: env.CHROMA_TOKEN
    ? {
        provider: 'token',
        credentials: env.CHROMA_TOKEN,
      }
    : undefined,
  chunkSize: env.CHUNK_SIZE,
}
