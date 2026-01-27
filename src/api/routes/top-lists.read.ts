import { FastifyInstance, FastifyRequest } from 'fastify'
import { getTags } from '../../config/openapi'
import { cachePlugin } from '../plugins/cache'
import {
  TopListSchema,
  getErrorSchemas,
} from '../schemas'
import { getTop5Entities, EntityType, KpiName } from '../services/topListsService'
import { z } from 'zod'

const entityTypeSchema = z.enum(['companies', 'regions', 'municipalities'])

const kpiNameSchema = z.enum([
  'calculatedTotalEmissions',
  'futureEmissionsTrendSlope',
  'emissionsChangeAbsolute',
  'emissionsChangeAdjusted',
  'historicalEmissionChangePercent',
  'totalTrend',
  'totalCarbonLaw',
  'procurementScore',
  'bicycleMetrePerCapita',
  'latestEmissions',
])

const topListParamsSchema = z.object({
  entity: entityTypeSchema,
  kpi: kpiNameSchema,
})

const topListQuerySchema = z.object({
  order: z.enum(['asc', 'desc']).default('desc').openapi({
    description: 'Sort order: asc for ascending (lowest first), desc for descending (highest first)',
  }),
})

export type TopListParams = z.infer<typeof topListParamsSchema>
export type TopListQuery = z.infer<typeof topListQuerySchema>

export async function topListsReadRoutes(app: FastifyInstance) {
  app.register(cachePlugin)

  app.get(
    '/:entity/:kpi',
    {
      schema: {
        summary: 'Get top 5 entities by KPI',
        description:
          'Retrieve the top 5 entities (companies, regions, or municipalities) ranked by a specific KPI. Returns entities with their names and KPI values. Use the order query parameter to specify ascending (asc) or descending (desc) sort order.',
        tags: getTags('TopLists'),
        params: topListParamsSchema,
        querystring: topListQuerySchema,
        response: {
          200: TopListSchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: TopListParams; Querystring: TopListQuery }>,
      reply,
    ) => {
      const { entity, kpi } = request.params
      const { order } = request.query

      try {
        const top5 = await getTop5Entities(
          entity as EntityType,
          kpi as KpiName,
          order,
        )

        if (top5.length === 0) {
          return reply.status(404).send({
            code: 'NOT_FOUND',
            message: 'No entities found with valid values for this KPI.',
          })
        }

        reply.send(top5)
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({
            code: 'BAD_REQUEST',
            message: error.message,
          })
        }
        return reply.status(500).send({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred.',
        })
      }
    },
  )
}
