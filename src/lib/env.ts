import { z } from 'zod'

const envSchema = z.object({
  /**
   * Comma-separated list of API tokens. E.g. garbo:lk3h2k1,alex:ax32bg4
   * NOTE: This is only relevant during import with alex data, and then we switch to proper auth tokens.
   */
  API_TOKENS: z.string().transform((tokens) => tokens.split(',')),
  PORT: z.coerce.number().default(3000),

  OPENAI_API_KEY: z.string(),
  OPENAI_ORG_ID: z.string(),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  CHROMA_HOST: z.string().default('http://127.0.0.1:8000'),
  CHROMA_TOKEN: z.string().optional(),

  DISCORD_TOKEN: z.string(),
  DISCORD_APPLICATION_ID: z.string(),
  DISCORD_SERVER_ID: z.string(),
  DISCORD_CHANNEL_ID: z.string(),

  NLM_INGESTOR_URL: z.string().default('http://0.0.0.0:5001'),
})

export const ENV = envSchema.parse(process.env)
