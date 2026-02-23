import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  GOOGLE_SCREENSHOT_BUCKET_KEY: z.string().optional(),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error(
    '❌ Invalid initialization of Google Screenshot Bucket environment variables:',
  )
  console.error(parsedEnv.error.format())

  if (
    parsedEnv.error.errors.some(
      (err) => err.path[0] === 'GOOGLE_SCREENSHOT_BUCKET_KEY',
    )
  ) {
    console.error('GOOGLE_SCREENSHOT_BUCKET_KEY must be a string.')
    console.error(
      'When running locally, this variable must be set in the local env file',
    )
    console.error(
      'In production, ensure this is correctly set in your Kubernetes config.',
    )
  }

  // throw new Error('Invalid initialization of Google Screenshot Bucket environment variables')
}

const env = parsedEnv.data

const googleScreenshotBucketConfig = {
  bucketKey: env?.GOOGLE_SCREENSHOT_BUCKET_KEY,
  bucketName: 'garbo-screenshots',
}

export default googleScreenshotBucketConfig
