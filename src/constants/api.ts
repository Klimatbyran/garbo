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
