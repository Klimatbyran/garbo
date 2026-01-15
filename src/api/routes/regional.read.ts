import { FastifyInstance, FastifyRequest } from 'fastify'
import { getTags } from '../../config/openapi'
import { RegionalNameParams } from '../types'
import { cachePlugin } from '../plugins/cache'
import {
  RegionalDataSchema,
  RegionalDataListSchema,
  RegionalKpiListSchema,
  RegionalSectorEmissionsSchema,
  getErrorSchemas,
  RegionalNameParamSchema,
} from '../schemas'
import { regionalService } from '../services/regionalService'
import { redisCache } from '../..'
import fs from 'fs'
import apiConfig from '../../config/api'

const REGIONS_CACHE_KEY = 'regions:all'
const REGIONS_TIMESTAMP_KEY = 'regions:timestamp'

const getDataFileTimestamp = (filePath: string): number => {
  try {
    const stats = fs.statSync(filePath)
    return stats.mtimeMs
  } catch (_) {
    return 0
  }
}

export async function regionalReadRoutes(app: FastifyInstance) {
  app.register(cachePlugin)

  app.get(
    '/',
    {
      schema: {
        summary: 'Get all regions',
        description:
          'Retrieve a list of all regions with their historical emissions data, trends, Paris agreement compliance status, and municipalities. Returns 304 Not Modified if the resource has not changed since the last request (based on ETag).',
        tags: getTags('Regions'),

        response: {
          200: RegionalDataListSchema,
        },
      },
    },
    async (_request, reply) => {
      const currentTimestamp = getDataFileTimestamp(apiConfig.regionDataPath)
      const etagValue = `"${currentTimestamp}"`

      const cachedRegions = await redisCache.get(REGIONS_CACHE_KEY)

      if (cachedRegions) {
        return reply.header('ETag', etagValue).send(cachedRegions)
      }

      const regions = await regionalService.getRegions()

      await redisCache.set(REGIONS_CACHE_KEY, JSON.stringify(regions))
      await redisCache.set(REGIONS_TIMESTAMP_KEY, currentTimestamp.toString())

      reply.header('ETag', etagValue).send(regions)
    },
  )

  app.get(
    '/kpis',
    {
      schema: {
        summary: 'Get regional KPIs',
        description:
          'Retrieve key performance indicators for all regions, including Paris agreement compliance and historical emission change percentages.',
        tags: getTags('Regions'),
        response: {
          200: RegionalKpiListSchema,
        },
      },
    },
    async (_request, reply) => {
      const kpis = regionalService.getRegionalKpis()
      reply.send(kpis)
    },
  )

  app.get(
    '/:name',
    {
      schema: {
        summary: 'Get one region',
        description:
          'Retrieve a specific region with its historical emissions data, trends, Paris agreement compliance status, and municipalities.',
        tags: getTags('Regions'),
        params: RegionalNameParamSchema,
        response: {
          200: RegionalDataSchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (request: FastifyRequest<{ Params: RegionalNameParams }>, reply) => {
      const { name } = request.params
      const region = regionalService.getRegion(name)

      if (!region) {
        return reply.status(404).send({
          code: 'NOT_FOUND',
          message: 'The requested resource could not be found.',
        })
      }

      reply.send(region)
    },
  )

  app.get(
    '/:name/sector-emissions',
    {
      schema: {
        summary: 'Get regional sector emissions',
        description:
          'Retrieve sector emissions data for a specific region, broken down by different sectors over time.',
        tags: getTags('Regions'),
        params: RegionalNameParamSchema,
        response: {
          200: RegionalSectorEmissionsSchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (request: FastifyRequest<{ Params: RegionalNameParams }>, reply) => {
      const { name } = request.params
      const sectorEmissions = regionalService.getRegionSectorEmissions(name)

      if (!sectorEmissions) {
        return reply.status(404).send({
          code: 'NOT_FOUND',
          message: 'The requested resource could not be found.',
        })
      }

      reply.send({ sectors: sectorEmissions })
    },
  )
}
