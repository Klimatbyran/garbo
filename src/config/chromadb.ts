import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  CHROMA_HOST: z.string().url(),
  CHROMA_TOKEN: z.string().optional(),
  CHUNK_SIZE: z.coerce.number(),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid initialization of ChromaDB environment variables:')
  console.error(parsedEnv.error.format())

  if (parsedEnv.error.errors.some(err => err.path[0] === 'CHROMA_HOST')) {
    console.error('CHROMA_HOST must be a valid URL in the format of a string.');
  }

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
