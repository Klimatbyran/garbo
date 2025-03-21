import 'dotenv/config'
import { z } from 'zod'

const nodeEnv = process.env.NODE_ENV

const envSchema = z.object({
  // These default to dummy values in the dev environment to avoid schema errors
  // when working on unrelated features.
  WIKI_USERNAME: z.string().default(nodeEnv !== "production"
    ? "wiki-username"
    : null
  ),
  WIKI_PASSWORD: z.string().default(nodeEnv !== "production"
    ? "wiki-password"
    : null
  ),
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
