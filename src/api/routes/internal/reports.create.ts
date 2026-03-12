import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'
import { getTags } from '@/config/openapi'
import {
  postReportsBodySchema,
  saveReportsBodySchema,
} from '../../schemas/request'
import {
  getErrorSchemas,
  ReportsListResponseSchema,
  saveReportsListResponseSchema,
} from '../../schemas'
import {
  PostReportsBody,
  saveReportsBody,
  saveReportError,
  saveReportSuccess,
} from '../../types'
import { reportsService } from '../../services/reportsService'

export async function reportsCreateRoutes(app: FastifyInstance) {
  app.post(
    '/',
    {
      schema: {
        summary: 'Scrape for reports',
        description:
          'Scrape for company reports based on the provided company name(s). This endpoint is intended to be used for scraping reports from external sources.',
        tags: getTags('Reports'),
        body: postReportsBodySchema,
        response: {
          200: ReportsListResponseSchema,
          ...getErrorSchemas(500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Body: PostReportsBody
      }>,
      reply
    ) => {
      try {
        const results = await reportsService.collectReportUrls(request.body)
        return reply.send(results)
      } catch (error) {
        console.error('ERROR scraping for company reports failed:', error)
        return reply
          .status(500)
          .send({ message: 'Scraping for company reports failed.' })
      }
    }
  ),
    app.post(
      '/save-reports',
      {
        schema: {
          summary: 'Add report to database',
          description:
            'Add a report to the database. This endpoint is intended to be used for adding reports that have been scraped from external sources.',
          tags: getTags('Reports'),
          body: saveReportsBodySchema,
          response: {
            200: saveReportsListResponseSchema,
            ...getErrorSchemas(500),
          },
        },
      },
      async (
        request: AuthenticatedFastifyRequest<{
          Body: saveReportsBody
        }>,
        reply
      ) => {
        try {
          const results = await reportsService.saveReportsToDb(request.body)
          const failed = results.filter(
            (r: saveReportError | saveReportSuccess) =>
              'error' in r && r.error === 'duplicate'
          )
          const successes = results.filter(
            (r: saveReportError | saveReportSuccess) => !('error' in r)
          )
          const responseBody = {
            message:
              failed.length > 0
                ? 'One or more reports already exist for the given company and year.'
                : 'All reports saved successfully.',
            successes,
            failed,
          }
          if (failed.length > 0) {
            return reply.status(409).send(responseBody)
          }
          return reply.send(responseBody)
        } catch (error) {
          console.error('ERROR saving company reports failed:', error)
          return reply
            .status(500)
            .send({ message: 'Saving company reports failed.' })
        }
      }
    )
}
