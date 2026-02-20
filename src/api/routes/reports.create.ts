import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'
import { getTags } from '@/config/openapi'
import { postReportsBodySchema } from '../schemas/request'
import { getErrorSchemas, ReportsListResponseSchema } from '../schemas'
import { PostReportsBody } from '../types'
import { reportsService } from '../services/reportsService'

export async function reportsCreateRoutes(app: FastifyInstance) {
  app.post(
    '/',
    {
      schema: {
        summary: 'Scrape for reports ',
        description:
          'Scrape for company reports based on the provided company name(s). This endpoint is intended to be used for scraping reports from external sources.',
        tags: getTags('Reports'),
        body: postReportsBodySchema,
        response: {
          200: ReportsListResponseSchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Body: PostReportsBody
      }>,
      reply,
    ) => {
      try {
        const results = await reportsService.collectReportUrls(request.body)

        return reply.send({ results })
      } catch (error) {
        console.error('ERROR scraping for company reports failed:', error)
        return reply
          .status(500)
          .send({ message: 'Scraping for company reports failed.' })
      }
    },
  )
}
