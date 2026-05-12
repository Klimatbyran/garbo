import { createServerCache } from '../createCache'

/** Shared API response cache — lives here so route modules never import `src/index.ts`. */
export const redisCache = createServerCache({ maxAge: 24 * 60 * 60 * 1000 })
