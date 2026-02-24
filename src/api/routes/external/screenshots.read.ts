import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import googleScreenshotBucketConfig from '@/config/googleScreenshotBucket'
import { Storage } from '@google-cloud/storage'
import { createSafeFolderName } from '@/lib/pathUtils'
import { getTags } from '@/config/openapi'

const credentials = googleScreenshotBucketConfig.bucketKey
  ? JSON.parse(
      Buffer.from(googleScreenshotBucketConfig.bucketKey, 'base64').toString()
    )
  : null
const storage = credentials
  ? new Storage({
      credentials,
      projectId: credentials.project_id,
    })
  : null

const screenshotsQuerySchema = z.object({
  url: z.string(),
})

const screenshotsResponseSchema = z.object({
  screenshots: z.array(z.string()),
})

export async function screenshotsReadRoutes(app: FastifyInstance) {
  app.get(
    '/screenshots',
    {
      schema: {
        summary: 'Get screenshots for a PDF URL',
        description: 'Returns a list of screenshot URLs for a given PDF URL',
        tags: getTags('Screenshots'),
        querystring: screenshotsQuerySchema,
        response: {
          200: screenshotsResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: z.infer<typeof screenshotsQuerySchema>
      }>,
      reply
    ) => {
      try {
        if (!storage) {
          return reply
            .status(503)
            .send({ error: 'Screenshot service not configured' })
        }

        const { url } = request.query

        const decodedUrl = decodeURIComponent(url)
        const safeFolderName = createSafeFolderName(decodedUrl)

        const bucket = storage.bucket(googleScreenshotBucketConfig.bucketName)
        const [files] = await bucket.getFiles({ prefix: `${safeFolderName}/` })

        const pngFiles = files.filter((file) => file.name.endsWith('.png'))

        const screenshots = await Promise.all(
          pngFiles.map(async (file) => {
            const [signedUrl] = await file.getSignedUrl({
              action: 'read',
              expires: Date.now() + 1000 * 60 * 60, // 1 hour
            })
            return signedUrl
          })
        )

        reply.send({ screenshots })
      } catch (error) {
        console.error('Get screenshots error:', error)
        return reply.status(500).send({ error: 'Failed to fetch screenshots' })
      }
    }
  )
}
