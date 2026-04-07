import { FastifyInstance, FastifyRequest } from 'fastify'
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
  SaveReportsBody,
  SaveReportError,
  SaveReportSuccess,
} from '../../types'
import { reportsService } from '../../services/reportsService'
import { redisCache } from '@/index'
import { invalidateRegistryCache } from '@/api/services/registryCache'

export async function reportsCreateRoutes(app: FastifyInstance) {
  app.post(
    '/search-reports',
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
      request: FastifyRequest<{
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
  )

  app.post(
    '/save-reports',
    {
      schema: {
        summary: 'Add reports to database',
        description:
          'Add one or more reports to the database. This endpoint is intended to be used for persisting reports that have been scraped from external sources.',
        tags: getTags('Reports'),
        body: saveReportsBodySchema,
        response: {
          200: saveReportsListResponseSchema,
          409: saveReportsListResponseSchema,
          500: saveReportsListResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: SaveReportsBody
      }>,
      reply
    ) => {
      try {
        const results = await reportsService.saveReportsToDb(request.body)
        const failed = results.filter(
          (r: SaveReportError | SaveReportSuccess): r is SaveReportError =>
            'error' in r
        )
        const successes = results.filter(
          (r: SaveReportError | SaveReportSuccess): r is SaveReportSuccess =>
            !('error' in r)
        )

        if (successes.length > 0) {
          await invalidateRegistryCache(redisCache, request.log)
        }

        if (failed.length === 0) {
          return reply.send({
            message: 'All reports saved successfully.',
            successes,
            failed,
          })
        }

        const hasUnknownFailures = failed.some((r) => r.error === 'unknown')
        if (hasUnknownFailures) {
          return reply.status(500).send({
            message:
              'One or more reports failed to save due to an internal error.',
            successes,
            failed,
          })
        }

        return reply.status(409).send({
          message: 'One or more reports already exist for the given URL.',
          successes,
          failed,
        })
      } catch (error) {
        console.error('ERROR saving company reports failed:', error)
        return reply.status(500).send({
          message: 'Saving company reports failed.',
          successes: [],
          failed: [],
        })
      }
    }
  )
}
