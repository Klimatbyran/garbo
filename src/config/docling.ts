import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  DOCLING_URL: z.string().nonempty(),
  BERGET_AI_TOKEN: z.string().nonempty(),
  DOCLING_USE_LOCAL: z.enum(['true', 'false']).transform((v) => v === 'true'),
})

// Parse environment variables
const parsedEnv = envSchema.safeParse(process.env)
if (!parsedEnv.success) {
  console.error('❌ Invalid Docling environment configuration:')
  console.error(parsedEnv.error.format())

  if (parsedEnv.error.errors.some((err) => err.path[0] === 'DOCLING_URL')) {
    console.error('DOCLING_URL must be a valid URL or string.')
    console.error('When running locally, it is typically http://localhost:5001')
    console.error(
      'In production, ensure this is correctly set in your Kubernetes config.',
    )
  }

  if (parsedEnv.error.errors.some((err) => err.path[0] === 'BERGET_AI_TOKEN')) {
    console.error('BERGET_AI_TOKEN must be an API key.')
    console.error(
      'Please ask another member for the key if you did not receive it yet',
    )
  }

  throw new Error('Invalid Docling environment configuration')
}

const { DOCLING_USE_LOCAL, BERGET_AI_TOKEN, DOCLING_URL } = parsedEnv.data

// If using local, default to http://localhost:5001 unless overridden
const rawUrl = DOCLING_USE_LOCAL 
  ? 'http://localhost:5001/v1' 
  : DOCLING_URL
const baseUrl = rawUrl.replace(/\/+$/, '')

if (!DOCLING_USE_LOCAL && (!baseUrl || !BERGET_AI_TOKEN)) {
  // In hosted mode, warn loudly to help diagnose misconfigurations
  console.warn(
    '⚠️ Docling hosted configuration appears incomplete (DOCLING_URL and/or BERGET_AI_TOKEN missing).',
  )
  console.warn(
    'Set DOCLING_USE_LOCAL=true to run against a local docling-serve, or provide the hosted credentials.',
  )
}

export default {
  baseUrl,
  BERGET_AI_TOKEN,
  DOCLING_USE_LOCAL,
}
