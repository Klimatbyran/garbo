import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  MAILCHIMP_API_KEY: z.string(),
  MAILCHIMP_SERVER_PREFIX: z.string(),
  MAILCHIMP_LIST_ID: z.string(),
})

const env = envSchema.parse(process.env)

export default {
    apiKey: env.MAILCHIMP_API_KEY,
    serverPrefix: env.MAILCHIMP_SERVER_PREFIX,
    listId: env.MAILCHIMP_LIST_ID,
}