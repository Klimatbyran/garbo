import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  WIKI_USERNAME: z.string(),
  WIKI_PASSWORD: z.string(),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid initialization of Wikipedia environment variables:')
  console.error(parsedEnv.error.format())

  if (parsedEnv.error.errors.some((err) => err.path[0] === 'WIKI_USERNAME')) {
    console.error('WIKI_USERNAME must be a username in the form of a string.')
  }

  if (parsedEnv.error.errors.some((err) => err.path[0] === 'WIKI_PASSWORD')) {
    console.error('WIKI_PASSWORD must be a password in the form of a string.')
  }

  throw new Error('Invalid initialization of Wikipedia environment variables')
}

const env = parsedEnv.data

export default {
  language: 'sv',
  apiUrl: 'test.wikipedia.org',
  editMsgSummary: 'Bot: Update emissions data',
  reportReferenceName: 'klimatkollen-emissions-report-reference',
  klimtkollenReferenceName: 'klimatkollen-emissions-reference',
  wikiUsername: env.WIKI_USERNAME,
  wikiPassword: env.WIKI_PASSWORD,
}
