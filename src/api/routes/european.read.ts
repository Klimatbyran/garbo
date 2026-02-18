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

const EUROPE_CACHE_KEY = 'europe:all'
const EUROPE_TIMESTAMP_KEY = 'europe:timestamp'

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
        tags: getTags('Europe'),

        response: {
          200: EuropeanDataListSchema,
        },
      },
    },
    async (_request, reply) => {
      const currentTimestamp = getDataFileTimestamp()
      const etagValue = `"${currentTimestamp}"`

      const cachedEurope = await redisCache.get(EUROPE_CACHE_KEY)

      if (cachedEurope) {
        return reply.header('ETag', etagValue).send(cachedEurope)
      }

      const europe = europeanService.getEurope()

      await redisCache.set(EUROPE_CACHE_KEY, JSON.stringify(europe))
      await redisCache.set(EUROPE_TIMESTAMP_KEY, currentTimestamp.toString())

      reply.header('ETag', etagValue).send(europe)
    },
  )

  app.get(
    '/kpis',
    {
      schema: {
        summary: 'Get European country KPIs',
        description:
          'Retrieve key performance indicators for all European countries, including Paris agreement compliance and historical emission change percentages.',
        tags: getTags('Europe'),
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
        tags: getTags('Europe'),
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
        tags: getTags('Europe'),
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
      const sectorEmissions = europeanService.getEuropeanSectorEmissions(name)

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
