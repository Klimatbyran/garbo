/**
 * Defaults so importing `src/config/api` / `openapi` during Jest does not throw
 * when the suite runs without a full `.env` (e.g. CI, or new clones).
 * Does not override variables that are already set (except NODE_ENV: Jest sets
 * `test`, which is not allowed by the API env schema).
 */
if (process.env.NODE_ENV === 'test') {
  process.env.NODE_ENV = 'development'
}

const defaults = {
  API_SECRET: 'jest-api-secret-12345678901234567890',
  FRONTEND_URL: 'http://localhost:5173/',
  API_BASE_URL: 'http://localhost:3000/',
  API_PORT: '3000',
  CACHE_MAX_AGE: '3600',
  GITHUB_CLIENT_ID: 'jest-github-client-id',
  GITHUB_CLIENT_SECRET: 'jest-github-client-secret',
  GITHUB_ORG: 'jest-org',
  GITHUB_REDIRECT_URI: 'http://localhost:3000/api/auth/github/callback',
  JWT_SECRET: 'jest-jwt-secret-1234567890123456789012',
  JWT_EXPIRES_IN: '86400',
  OPENAPI_PREFIX: 'reference',
  REDIS_HOST: '127.0.0.1',
  REDIS_PORT: '6379',
}

for (const [key, value] of Object.entries(defaults)) {
  if (process.env[key] === undefined) {
    process.env[key] = value
  }
}
