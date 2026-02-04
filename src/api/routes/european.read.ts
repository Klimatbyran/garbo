import { FastifyInstance, FastifyRequest } from 'fastify'
import { getTags } from '../../config/openapi'
import { EuropeanCountryNameParams } from '../types'
import { cachePlugin } from '../plugins/cache'
import {
  EuropeanDataSchema,
  EuropeanDataListSchema,
  EuropeanKpiListSchema,
  EuropeanSectorEmissionsSchema,
  getErrorSchemas,
  EuropeanCountryNameParamSchema,
} from '../schemas'
import { europeanService } from '../services/europeanService'
import { redisCache } from '../..'
import fs from 'fs'
import apiConfig from '../../config/api'

const EUROPEANS_CACHE_KEY = 'europeans:all'
const EUROPEANS_TIMESTAMP_KEY = 'europeans:timestamp'

const getDataFileTimestamp = (): number => {
  try {
    const stats = fs.statSync(apiConfig.europeanDataPath)
    return stats.mtimeMs
  } catch (_) {
    return 0
  }
}

export async function europeanReadRoutes(app: FastifyInstance) {
  app.register(cachePlugin)

  app.get(
    '/',
    {
      schema: {
        summary: 'Get all European countries',
        description:
          'Retrieve a list of all European countries with their historical emissions data, trends, Paris agreement compliance status. Returns 304 Not Modified if the resource has not changed since the last request (based on ETag).',
        tags: getTags('Europeans'),

        response: {
          200: EuropeanDataListSchema,
        },
      },
    },
    async (_request, reply) => {
      const currentTimestamp = getDataFileTimestamp()
      const etagValue = `"${currentTimestamp}"`

      const cachedEuropeans = await redisCache.get(EUROPEANS_CACHE_KEY)

      if (cachedEuropeans) {
        return reply.header('ETag', etagValue).send(cachedEuropeans)
      }

      const europeans = europeanService.getEuropeans()

      await redisCache.set(
        EUROPEANS_CACHE_KEY,
        JSON.stringify(europeans),
      )
      await redisCache.set(
        EUROPEANS_TIMESTAMP_KEY,
        currentTimestamp.toString(),
      )

      reply.header('ETag', etagValue).send(europeans)
    },
  )

  app.get(
    '/kpis',
    {
      schema: {
        summary: 'Get European country KPIs',
        description:
          'Retrieve key performance indicators for all European countries, including Paris agreement compliance and historical emission change percentages.',
        tags: getTags('Europeans'),
        response: {
          200: EuropeanKpiListSchema,
        },
      },
    },
    async (_request, reply) => {
      const kpis = europeanService.getEuropeanKpis()
      reply.send(kpis)
    },
  )

  app.get(
    '/:name',
    {
      schema: {
        summary: 'Get one European country',
        description:
          'Retrieve a specific European country with its historical emissions data, trends, Paris agreement compliance status.',
        tags: getTags('Europeans'),
        params: EuropeanCountryNameParamSchema,
        response: {
          200: EuropeanDataSchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: EuropeanCountryNameParams }>,
      reply,
    ) => {
      const { name } = request.params
      const european = europeanService.getEuropean(name)

      if (!european) {
        return reply.status(404).send({
          code: 'NOT_FOUND',
          message: 'The requested resource could not be found.',
        })
      }

      reply.send(european)
    },
  )

  app.get(
    '/:name/sector-emissions',
    {
      schema: {
        summary: 'Get European country sector emissions',
        description:
          'Retrieve sector emissions data for a specific European country, broken down by different sectors over time.',
        tags: getTags('Europeans'),
        params: EuropeanCountryNameParamSchema,
        response: {
          200: EuropeanSectorEmissionsSchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: EuropeanCountryNameParams }>,
      reply,
    ) => {
      const { name } = request.params
      const sectorEmissions =
        europeanService.getEuropeanSectorEmissions(name)

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
