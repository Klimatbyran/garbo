import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
})

const env = envSchema.parse(process.env)

export default {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
}
import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
})

const env = envSchema.parse(process.env)

export default {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
}
