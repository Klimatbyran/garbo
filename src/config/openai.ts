import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  OPENAI_API_KEY: z.string(),
  OPENAI_ORG_ID: z.string(),
  /**
   * Model that `askStream` retries on, once, when the input is too long for
   * the primary model's context window. It gets the same request as the
   * primary model, so it must accept `temperature`, `max_tokens` and a JSON
   * schema response format. Temporary: OpenAI retires gpt-4o and gpt-4.1 on
   * 2027-01-14.
   */
  OPENAI_CONTEXT_FALLBACK_MODEL: z
    .string()
    .trim()
    .min(1)
    .optional()
    .default('gpt-4.1-2025-04-14'),
  /** `false` turns the context-window fallback off. On when unset. */
  OPENAI_CONTEXT_FALLBACK_ENABLED: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional()
    .default(true),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid initialization of OpenAI environment variables:')
  console.error(parsedEnv.error.format())

  if (parsedEnv.error.issues.some((err) => err.path[0] === 'OPENAI_API_KEY')) {
    console.error('OPENAI_API_KEY must be a key in the form of a string.')
    console.error(
      'Please ask another member for the key if you did not receive it yet'
    )
  }

  if (parsedEnv.error.issues.some((err) => err.path[0] === 'OPENAI_ORG_ID')) {
    console.error('OPENAI_ORG_ID must be an ID in the form of a string.')
  }

  throw new Error('Invalid initialization of OpenAI environment variables')
}

const env = parsedEnv.data

export default {
  // Used by the `openai` Node.js API and `@chroma-core/openai`:
  organization: env.OPENAI_ORG_ID,
  apiKey: env.OPENAI_API_KEY,

  // Used by `askStream`; null when the fallback is turned off:
  contextFallbackModel: env.OPENAI_CONTEXT_FALLBACK_ENABLED
    ? env.OPENAI_CONTEXT_FALLBACK_MODEL
    : null,
}
