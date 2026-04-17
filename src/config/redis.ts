import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number(),
  REDIS_PASSWORD: z.string().optional(),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid initialization of Redis environment variables:')
  console.error(parsedEnv.error.format())

  if (parsedEnv.error.errors.some((err) => err.path[0] === 'REDIS_HOST')) {
    console.error('REDIS_HOST must be a host in the form of a string.')
  }

  if (parsedEnv.error.errors.some((err) => err.path[0] === 'REDIS_PORT')) {
    console.error('REDIS_PORT must be a port in the form of a number.')
  }

  if (parsedEnv.error.errors.some((err) => err.path[0] === 'REDIS_PASSWORD')) {
    console.error('REDIS_PASSWORD must be an password in the form of a string.')
  }

  throw new Error('Invalid initialization of Redis environment variables')
}

const env = parsedEnv.data

export default {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  // Required for BullMQ: queue commands instead of failing immediately on disconnect
  maxRetriesPerRequest: null,
  // Reconnect with exponential backoff (caps at 30s) instead of crashing
  retryStrategy(times: number) {
    return Math.min(times * 1000, 30000)
  },
}
