import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  MAILCHIMP_API_KEY: z.string(),
  MAILCHIMP_SERVER_PREFIX: z.string(),
  MAILCHIMP_LIST_ID: z.string(),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid Mailchimp environment configuration:')
  console.error(parsedEnv.error.format())

  if (parsedEnv.error.errors.some(err => err.path[0] === 'MAILCHIMP_API_KEY')) {
    console.error('MAILCHIMP_API_KEY must be a API key in the format of a string.');
    console.error('Please ask another member for the key if you did not receive it yet');
  }

  throw new Error('Invalid Mailchimp environment configuration')
}

const env = parsedEnv.data

export default {
    apiKey: env.MAILCHIMP_API_KEY,
    serverPrefix: env.MAILCHIMP_SERVER_PREFIX,
    listId: env.MAILCHIMP_LIST_ID,
}