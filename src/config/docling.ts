import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  DOCLING_URL: z.string().nonempty(),
  BERGET_AI_TOKEN: z.string().nonempty(),
  DOCLING_USE_LOCAL: z.enum(['true', 'false']).transform((v) => v === 'true'),
  USE_BACKUP_API: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional()
    .default('false'),
  BACKUP_API_URL: z.string().optional(),
  BACKUP_API_TOKEN: z.string().optional(),
  BACKUP_API_AUTH_HEADER: z
    .enum(['authorization', 'x-api-key'])
    .optional()
    .default('authorization'),
})

// Parse environment variables
const parsedEnv = envSchema.safeParse(process.env)
if (!parsedEnv.success) {
  console.error('❌ Invalid Docling environment configuration:')
  console.error(parsedEnv.error.format())

  if (parsedEnv.error.errors.some((err) => err.path[0] === 'DOCLING_URL')) {
    console.error('DOCLING_URL must be a valid URL or string.')
    console.error(
      'Examples: http://localhost:5001/v1 (local), https://api.example.com (remote)',
    )
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

const {
  DOCLING_USE_LOCAL,
  BERGET_AI_TOKEN,
  DOCLING_URL,
  USE_BACKUP_API,
  BACKUP_API_URL,
  BACKUP_API_TOKEN,
  BACKUP_API_AUTH_HEADER,
} = parsedEnv.data

// DOCLING_USE_LOCAL now only controls format, not URL
// To use localhost, just set DOCLING_URL=http://localhost:5001/v1
const baseUrl = DOCLING_URL.replace(/\/+$/, '')

if (!DOCLING_USE_LOCAL && (!baseUrl || !BERGET_AI_TOKEN)) {
  // When using Berget format, warn if config is incomplete
  console.warn(
    '⚠️ Docling configuration appears incomplete when using Berget format (DOCLING_URL and/or BERGET_AI_TOKEN missing).',
  )
  console.warn(
    'Either set DOCLING_USE_LOCAL=true to use local format, or provide DOCLING_URL and BERGET_AI_TOKEN for Berget format.',
  )
}

// Validate backup API configuration if enabled
if (USE_BACKUP_API && (!BACKUP_API_URL || !BACKUP_API_TOKEN)) {
  throw new Error(
    'USE_BACKUP_API is true but BACKUP_API_URL or BACKUP_API_TOKEN is missing',
  )
}

export default {
  baseUrl,
  BERGET_AI_TOKEN,
  DOCLING_USE_LOCAL,
  USE_BACKUP_API: USE_BACKUP_API || false,
  BACKUP_API_URL: BACKUP_API_URL || '',
  BACKUP_API_TOKEN: BACKUP_API_TOKEN || '',
  BACKUP_API_AUTH_HEADER: BACKUP_API_AUTH_HEADER || 'authorization',
}
