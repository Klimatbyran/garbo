import { z } from 'zod'

const envSchema = z.object({
  /**
   * Comma-separated list of API tokens. E.g. garbo:lk3h2k1,alex:ax32bg4
   * NOTE: This is only relevant during import with alex data, and then we switch to proper auth tokens.
   */
  API_TOKENS: z.string().transform((tokens) => tokens.split(',')),
  FRONTEND_URL: z
    .string()
    .default(
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:4321'
        : 'https://beta.klimatkollen.se'
    ),
  API_BASE_URL: z.string().default('http://localhost:3000/api'),
  PORT: z.coerce.number().default(3000),
})

const env = envSchema.parse(process.env)

export const CACHE_MAX_AGE = 3000

export const AUTHORIZED_USERS = {
  garbo: 'hej@klimatkollen.se',
  alex: 'alex@klimatkollen.se',
} as const

export const DEVELOPMENT_ORIGINS = ['http://localhost:4321']
export const PRODUCTION_ORIGINS = ['https://beta.klimatkollen.se', 'https://klimatkollen.se']

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const

export type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS]

export default {
  tokens: env.API_TOKENS,
  frontendURL: env.FRONTEND_URL,
  baseURL: env.API_BASE_URL,
  port: env.PORT,
}
