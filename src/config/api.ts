import 'dotenv/config'
import { FastifyServerOptions } from 'fastify'
import { resolve } from 'path'
import { z } from 'zod'

const nodeEnv = process.env.NODE_ENV

const envSchema = z.object({
  API_SECRET: z.string(),
  FRONTEND_URL_DEV: z.string().url(),
  FRONTEND_URL_STAGING: z.string().url(),
  FRONTEND_URL_PROD: z.string().url(),
  API_BASE_URL_DEV: z.string().url(),
  API_BASE_URL_STAGING: z.string().url(),
  API_BASE_URL_PROD: z.string().url(),
  PORT: z.coerce.number(),
  CACHE_MAX_AGE: z.coerce.number(),
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GITHUB_ORGANIZATION: z.string(),
  GITHUB_REDIRECT_URI: z.string().url(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.coerce.number(),
})

const env = envSchema.parse(process.env)

const ONE_DAY = 1000 * 60 * 60 * 24

const developmentOrigins = [
  env.FRONTEND_URL_DEV,
  env.API_BASE_URL_DEV.slice(0, -4),
] as const

const stageOrigins = [
  env.FRONTEND_URL_STAGING,
  env.API_BASE_URL_STAGING.slice(0, -4)
] as const

const productionOrigins = [
  env.FRONTEND_URL_PROD,
  env.API_BASE_URL_PROD.slice(0, -4)
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

  nodeEnv: env.NODE_ENV,
  secret: env.API_SECRET,
  prodBaseURL: env.API_BASE_URL_PROD,
  frontendURL: env.NODE_ENV === 'development' ? env.FRONTEND_URL_DEV : 
                env.NODE_ENV === 'staging' ? env.FRONTEND_URL_STAGING :
                env.FRONTEND_URL_PROD,
  baseURL: env.NODE_ENV === 'development' ? env.API_BASE_URL_DEV :
            env.NODE_ENV === 'staging' ? env.API_BASE_URL_STAGING : 
            env.API_BASE_URL_PROD,
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
