import { FastifyInstance } from 'fastify'
import { getTags } from '../../config/openapi'
import { cachePlugin } from '../plugins/cache'
import {
  NationDataSchema,
  NationalSectorEmissionsSchema,
  getErrorSchemas,
} from '../schemas'
import { nationService } from '../services/nationService'
import { redisCache } from '../..'
import fs from 'fs'
import apiConfig from '../../config/api'

const NATION_CACHE_KEY = 'nation:data'
const NATION_TIMESTAMP_KEY = 'nation:timestamp'

const getDataFileTimestamp = (filePath: string): number => {
  try {
    const stats = fs.statSync(filePath)
    return stats.mtimeMs
  } catch (_) {
    return 0
  }
}

export async function nationalReadRoutes(app: FastifyInstance) {
  app.register(cachePlugin)

  app.get(
    '/',
    {
      schema: {
        summary: 'Get national data',
        description:
          'Retrieve national (Sweden) data with historical emissions, trends, and Paris agreement compliance status. Returns 304 Not Modified if the resource has not changed since the last request (based on ETag).',
        tags: getTags('Nation'),

        response: {
          200: NationDataSchema,
          ...getErrorSchemas(404),
        },
      },
    },
    async (_request, reply) => {
      const currentTimestamp = getDataFileTimestamp(apiConfig.nationDataPath)
      const etagValue = `"${currentTimestamp}"`

      const cachedNation = await redisCache.get(NATION_CACHE_KEY)

      if (cachedNation) {
        return reply.header('ETag', etagValue).send(cachedNation)
      }

      const nation = nationService.getNation()

      if (!nation) {
        return reply.status(404).send({
          code: 'NOT_FOUND',
          message: 'The requested resource could not be found.',
        })
      }

      await redisCache.set(NATION_CACHE_KEY, JSON.stringify(nation))
      await redisCache.set(NATION_TIMESTAMP_KEY, currentTimestamp.toString())

      reply.header('ETag', etagValue).send(nation)
    },
  )

  app.get(
    '/sector-emissions',
    {
      schema: {
        summary: 'Get national sector emissions',
        description:
          'Retrieve sector emissions data for Sweden, broken down by different sectors over time.',
        tags: getTags('Nation'),
        response: {
          200: NationalSectorEmissionsSchema,
          ...getErrorSchemas(404),
        },
      },
    },
    async (_request, reply) => {
      const sectorEmissions = nationService.getNationSectorEmissions()

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
