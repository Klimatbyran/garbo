import 'dotenv/config'
import { FastifyServerOptions } from 'fastify'
import { resolve } from 'path'
import { z } from 'zod'

const envSchema = z.object({
  API_SECRET: z.string(),
  FRONTEND_URL: z.string().url(),
  API_BASE_URL: z.string().url(),
  API_PORT: z.coerce.number(),
  CACHE_MAX_AGE: z.coerce.number(),
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GITHUB_ORG: z.string(),
  GITHUB_REDIRECT_URI: z.string().url(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.coerce.number(),
  PROD_BASE_URL: z.string().default('https://api.klimatkollen.se/api'),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid initialization of API environment variables:')
  console.error(parsedEnv.error.format())

  if (parsedEnv.error.errors.some((err) => err.path[0] === 'API_SECRET')) {
    console.error('API_SECRET must be a secret in the form of a string.')
    console.error('When running locally, this variable can be set freely.')
    console.error(
      'In production, ensure this is correctly set in your Kubernetes config.',
    )
  }

  if (parsedEnv.error.errors.some((err) => err.path[0] === 'JWT_SECRET')) {
    console.error('JWT_SECRET must be a secret in the form of a string.')
    console.error('When running locally, this variable can be set freely.')
    console.error(
      'In production, ensure this is correctly set in your Kubernetes config.',
    )
  }

  throw new Error('Invalid initialization of API environment variables')
}

const env = parsedEnv.data

const ONE_DAY = 1000 * 60 * 60 * 24

const developmentOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
] as const

const stageOrigins = [
  'https://stage-api.klimatkollen.se',
  'https://stage.klimatkollen.se',
  'https://validate-stage.klimatkollen.se',
  'http://localhost:5173',
  'http://localhost:5174',
] as const

const productionOrigins = [
  'https://klimatkollen.se',
  'https://api.klimatkollen.se',
  'https://validate.klimatkollen.se',
  'https://validate-stage.klimatkollen.se',
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
    env.NODE_ENV === 'staging'
      ? stageOrigins
      : env.NODE_ENV === 'production'
        ? productionOrigins
        : developmentOrigins,

  nodeEnv: env.NODE_ENV,
  secret: env.API_SECRET,
  prodBaseURL: env.PROD_BASE_URL,
  frontendURL: env.FRONTEND_URL,
  baseURL: env.API_BASE_URL,
  port: env.API_PORT,
  jobDelay: ONE_DAY,
  githubClientId: env.GITHUB_CLIENT_ID,
  githubClientSecret: env.GITHUB_CLIENT_SECRET,
  githubOrganization: env.GITHUB_ORG,
  githubRedirectUri: env.GITHUB_REDIRECT_URI,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,

  municipalityDataPath: resolve(
    import.meta.dirname,
    '../data/municipality-data.json',
  ),

  municipalitySectorEmissionsPath: resolve(
    import.meta.dirname,
    '../data/municipality-sector-emissions.json',
  ),

  regionDataPath: resolve(import.meta.dirname, '../data/region-data.json'),

  regionSectorEmissionsPath: resolve(
    import.meta.dirname,
    '../data/region-sector-emissions.json',
  ),

  nationDataPath: resolve(import.meta.dirname, '../data/nation-data.json'),

  nationSectorEmissionsPath: resolve(
    import.meta.dirname,
    '../data/nation-sector-emissions.json',
  ),

  europeanDataPath: resolve(
    import.meta.dirname,
    '../data/european-data.json',
  ),

  bullBoardBasePath: '/admin/queues',

  logger: (env.NODE_ENV !== 'production' && process.stdout.isTTY
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
