import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  CHROMA_HOST: z.string(),
  CHROMA_CHUNK_SIZE: z.coerce.number(),
  CHROMA_CONCURRENCY: z.coerce.number().int().positive().default(2),
  CHROMA_EMBEDDING_MODEL: z.string().default('text-embedding-ada-002'),
  CHROMA_RETRIEVAL_CACHE_TTL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(48 * 60 * 60 * 1000),
  CHROMA_EMBEDDING_CACHE_TTL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(21 * 24 * 60 * 60 * 1000),
  CHROMA_CACHE_MAX_PAYLOAD_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(256 * 1024),
  CHROMA_CACHE_SCHEMA_VERSION: z.string().default('v1'),
  CHROMA_CACHE_ENABLE_COMPRESSION: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((v) => v === 'true'),
  CHROMA_CACHE_COMPRESSION_MIN_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(64 * 1024),
  CHROMA_PREFETCH_AFTER_INDEX: z
    .enum(['true', 'false'])
    .optional()
    .default('true')
    .transform((v) => v === 'true'),
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
  concurrency: env.CHROMA_CONCURRENCY,
  embeddingModel: env.CHROMA_EMBEDDING_MODEL,
  retrievalCacheTtlMs: env.CHROMA_RETRIEVAL_CACHE_TTL_MS,
  embeddingCacheTtlMs: env.CHROMA_EMBEDDING_CACHE_TTL_MS,
  cacheMaxPayloadBytes: env.CHROMA_CACHE_MAX_PAYLOAD_BYTES,
  cacheSchemaVersion: env.CHROMA_CACHE_SCHEMA_VERSION,
  cacheEnableCompression: env.CHROMA_CACHE_ENABLE_COMPRESSION,
  cacheCompressionMinBytes: env.CHROMA_CACHE_COMPRESSION_MIN_BYTES,
  prefetchAfterIndex: env.CHROMA_PREFETCH_AFTER_INDEX,
}
