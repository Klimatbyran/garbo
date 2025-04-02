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
  API_SECRET: z.string(),
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
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('production'),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GITHUB_ORGANIZATION: z.string().default("Klimatbyran"),
  GITHUB_REDIRECT_URI: z.string().default("http://localhost:5137/auth/callback"),
  JWT_SECRET: z.string().default("tmdMFIfrucXH1m4rRHWF53dWtmAcWngPMQ6O5mIeH1g="),
  JWT_EXPIRES_IN: z.string().default("3600"),
  PROD_BASE_URL: z.string().default("https://api.klimatkollen.se/api")
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

  secret: env.API_SECRET,
  prod_base_url: env.PROD_BASE_URL,
  frontendURL: env.FRONTEND_URL,
  baseURL: env.API_BASE_URL,
  port: env.PORT,
  jobDelay: ONE_DAY,
  githubClientId: env.GITHUB_CLIENT_ID,
  githubClientSecret: env.GITHUB_CLIENT_SECRET,
  githubOrganization: env.GITHUB_ORGANIZATION,
  githubRedirectUri: env.GITHUB_REDIRECT_URI,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,

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
