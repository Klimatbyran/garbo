import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  DOCLING_URL: z.string().url().nonempty(),
  BERGET_AI_TOKEN: z.string().nonempty()
})

// Parse environment variables
const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid environment configuration:')
  console.error(parsedEnv.error.format())

  if (parsedEnv.error.errors.some(err => err.path[0] === 'DOCLING_URL')) {
    console.error('DOCLING_URL must be a valid URL.');
    console.error('When running locally, it is typically http://localhost:5002');
    console.error('In production, ensure this is correctly set in your Kubernetes config.');
  }

  if (parsedEnv.error.errors.some(err => err.path[0] === 'BERGET_AI_TOKEN')) {
    console.error('BERGET_AI_TOKEN must be a API key.');
    console.error('Please ask another member for the key if you did not receive it yet');
  }

  throw new Error('Invalid environment configuration')
}

const { DOCLING_URL, BERGET_AI_TOKEN } = parsedEnv.data

// Trim trailing slashes for consistency in URL joining
const normalizedDoclingUrl = DOCLING_URL.replace(/\/+$/, '')

export default {
  baseUrl: normalizedDoclingUrl,
  bergetAIToken: BERGET_AI_TOKEN
}
