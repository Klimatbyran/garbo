import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  WIKI_USERNAME: z.string(),
  WIKI_PASSWORD: z.string(),
})

const env = envSchema.parse(process.env)

export default {
    language: "sv",
    apiUrl: "test.wikipedia.org",
    editMsgSummary: "Bot: Update emissions data",
    reportReferenceName: "klimatkollen-emissions-report-reference",
    klimtkollenReferenceName: "klimatkollen-emissions-reference",
    wikiUsername: env.WIKI_USERNAME,
    wikiPassword: env.WIKI_PASSWORD
}