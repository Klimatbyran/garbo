import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { getTags } from '../../../config/openapi'
import { getErrorSchemas } from '../../schemas'
import { registryService } from '@/api/services/registryService'

const markdownQuerySchema = z.object({
  url: z.string().url(),
})

const markdownResponseSchema = z.object({
  url: z.string(),
  markdown: z.string(),
})

export async function registryMarkdownRoutes(app: FastifyInstance) {
  app.get(
    '/markdown',
    {
      schema: {
        summary: 'Get the parsed markdown for a report URL',
        description:
          'Returns the full docling-parsed markdown persisted for a report URL, independent of Chroma. Lets other pipelines (e.g. callbackUrl consumers) or reindexing jobs get the document back without re-running docling.',
        tags: getTags('Registry'),
        querystring: markdownQuerySchema,
        response: {
          200: markdownResponseSchema,
          ...getErrorSchemas(404),
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: z.infer<typeof markdownQuerySchema> }>,
      reply
    ) => {
      const { url } = request.query
      const markdown = await registryService.getMarkdownByUrl(url)

      if (!markdown) {
        return reply.status(404).send({
          code: 'NOT_FOUND',
          message: `No markdown found for URL: ${url}`,
        })
      }

      return reply.send({ url, markdown })
    }
  )
}
