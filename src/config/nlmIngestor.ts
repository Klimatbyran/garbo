import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NLM_INGESTOR_URL: z.string(),
})

export const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid NLM Ingestor environment configuration:')
  console.error(parsedEnv.error.format())

  if (
    parsedEnv.error.errors.some((err) => err.path[0] === 'NLM_INGESTOR_URL')
  ) {
    console.error('NLM_INGESTOR_URL must be a valid URL or string.')
    console.error('When running locally, it is typically http://0.0.0.0:5001')
    console.error(
      'In production, ensure this is correctly set in your Kubernetes config.'
    )
  }

  throw new Error('Invalid NLM Ingestor environment configuration')
}

const env = parsedEnv.data

export default {
  url: env.NLM_INGESTOR_URL,
}
