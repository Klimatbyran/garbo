import OpenAI from 'openai'
import { z } from 'zod'

const envSchema = z.object({
  OPENAI_API_KEY: z.string(),
})

const env = envSchema.parse(process.env)

export default {
  apiKey: env.OPENAI_API_KEY,
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
