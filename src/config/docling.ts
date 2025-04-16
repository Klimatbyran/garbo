import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  DOCLING_URL: z.string().url().nonempty(),
})

// Parse environment variables
const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid environment configuration:')
  console.error(parsedEnv.error.format())

  if (parsedEnv.error.errors.some(err => err.path[0] === 'DOCLING_URL')) {
    console.error('DOCLING_URL must be a valid URL.')
    console.error('When running locally, it is typically http://localhost:5002')
    console.error('In production, ensure this is correctly set in your Kubernetes config.')
  }

  throw new Error('Invalid environment configuration')
}

const { DOCLING_URL } = parsedEnv.data

// Trim trailing slashes for consistency in URL joining
const normalizedDoclingUrl = DOCLING_URL.replace(/\/+$/, '')

export default {
  baseUrl: normalizedDoclingUrl,
}
