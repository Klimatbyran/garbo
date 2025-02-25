import 'dotenv/config'
import { FastifyServerOptions } from 'fastify'
import { resolve } from 'path'
import { z } from 'zod'

const nodeEnv = process.env.NODE_ENV

const envSchema = z.object({
  /**
   * Comma-separated list of API tokens. E.g. garbo:lk3h2k1,alex:ax32bg4
   * NOTE: This is only relevant during import with alex data, and then we switch to proper auth tokens.
   */
  API_TOKENS: z.string().transform((tokens) => tokens.split(',')),
  FRONTEND_URL: z
    .string()
    .default(
      nodeEnv === 'development'
        ? 'http://localhost:5173'
        : nodeEnv === 'staging'
        ? 'https://stage.klimatkollen.se'
        : 'https://beta.klimatkollen.se'
    ),
  API_BASE_URL: z.string().default('http://localhost:3000/api'),
  PORT: z.coerce.number().default(3000),
  CACHE_MAX_AGE: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('production'),
})

const env = envSchema.parse(process.env)

const ONE_DAY = 1000 * 60 * 60 * 24

const developmentOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
] as const

const stageOrigins = [
  'https://stage-api.klimatkollen.se',
  'https://stage.klimatkollen.se',
] as const

const productionOrigins = [
  'https://beta.klimatkollen.se',
  'https://klimatkollen.se',
  'https://api.klimatkollen.se',
] as const

const baseLoggerOptions: FastifyServerOptions['logger'] = {
  // TODO: Redact all sensitive data
  redact: ['req.headers.authorization'],
}

const apiConfig = {
  cacheMaxAge: env.CACHE_MAX_AGE,

  authorizedUsers: {
    garbo: 'hej@klimatkollen.se',
    alex: 'alex@klimatkollen.se',
  } as const,

  corsAllowOrigins:
    nodeEnv === 'staging'
      ? stageOrigins
      : nodeEnv === 'production'
      ? productionOrigins
      : developmentOrigins,

  tokens: env.API_TOKENS,
  frontendURL: env.FRONTEND_URL,
  baseURL: env.API_BASE_URL,
  port: env.PORT,
  jobDelay: ONE_DAY,

  municipalityDataPath: resolve(
    import.meta.dirname,
    '../data/climate-data.json'
  ),

  bullBoardBasePath: '/admin/queues',

  logger: (nodeEnv !== 'production' && process.stdout.isTTY
    ? {
        level: 'trace',
        transport: { target: 'pino-pretty' },
        ...baseLoggerOptions,
      }
    : {
        level: 'info',
        ...baseLoggerOptions,
      }) as FastifyServerOptions['logger'],
}

export default apiConfig
