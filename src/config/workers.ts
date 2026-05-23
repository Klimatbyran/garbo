import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  FOLLOW_UP_DEFAULT_CONCURRENCY: z.coerce.number().int().positive().default(1),
  FOLLOW_UP_SCOPE_12_CONCURRENCY: z.coerce.number().int().positive().default(2),
  FOLLOW_UP_SCOPE_1_CONCURRENCY: z.coerce.number().int().positive().default(2),
  FOLLOW_UP_SCOPE_2_CONCURRENCY: z.coerce.number().int().positive().default(2),
  FOLLOW_UP_SCOPE_3_CONCURRENCY: z.coerce.number().int().positive().default(1),
  FOLLOW_UP_ECONOMY_CONCURRENCY: z.coerce.number().int().positive().default(1),
  FOLLOW_UP_COMPANY_TAGS_CONCURRENCY: z.coerce
    .number()
    .int()
    .positive()
    .default(1),
  FOLLOW_UP_RATE_LIMIT_ENABLED: z
    .enum(['true', 'false'])
    .optional()
    .default('true')
    .transform((v) => v === 'true'),
  FOLLOW_UP_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(6),
  FOLLOW_UP_RATE_LIMIT_DURATION_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(1000),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid initialization of worker environment variables:')
  console.error(parsedEnv.error.format())
  throw new Error('Invalid initialization of worker environment variables')
}

const env = parsedEnv.data

const followUpConcurrencyByQueue: Record<string, number> = {
  followUpScope12: env.FOLLOW_UP_SCOPE_12_CONCURRENCY,
  followUpScope1: env.FOLLOW_UP_SCOPE_1_CONCURRENCY,
  followUpScope2: env.FOLLOW_UP_SCOPE_2_CONCURRENCY,
  followUpScope3: env.FOLLOW_UP_SCOPE_3_CONCURRENCY,
  followUpEconomy: env.FOLLOW_UP_ECONOMY_CONCURRENCY,
  followUpCompanyTags: env.FOLLOW_UP_COMPANY_TAGS_CONCURRENCY,
}

function getFollowUpConcurrency(queueName: string): number {
  return (
    followUpConcurrencyByQueue[queueName] ?? env.FOLLOW_UP_DEFAULT_CONCURRENCY
  )
}

export default {
  getFollowUpConcurrency,
  followUpRateLimitEnabled: env.FOLLOW_UP_RATE_LIMIT_ENABLED,
  followUpRateLimitMax: env.FOLLOW_UP_RATE_LIMIT_MAX,
  followUpRateLimitDurationMs: env.FOLLOW_UP_RATE_LIMIT_DURATION_MS,
}
