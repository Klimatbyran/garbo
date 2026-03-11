import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  CHROMA_HOST: z.string(),
  CHROMA_CHUNK_SIZE: z.coerce.number(),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid initialization of ChromaDB environment variables:')
  console.error(parsedEnv.error.format())

  if (parsedEnv.error.errors.some((err) => err.path[0] === 'CHROMA_HOST')) {
    console.error('CHROMA_HOST must be in the format of a string.')
  }

  if (
    parsedEnv.error.errors.some((err) => err.path[0] === 'CHROMA_CHUNK_SIZE')
  ) {
    console.error('CHROMA_CHUNK_SIZE must be a number.')
  }

  throw new Error('Invalid initialization of ChromaDB environment variables')
}

const env = parsedEnv.data

export default {
  path: env.CHROMA_HOST,
  chunkSize: env.CHROMA_CHUNK_SIZE,
}
