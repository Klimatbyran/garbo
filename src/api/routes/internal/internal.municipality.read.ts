import { FastifyInstance, FastifyRequest } from 'fastify'
import { getTags } from '../../../config/openapi'
import { MunicipalityNameParams } from '../../types'
import { cachePlugin } from '../../plugins/cache'
import {
  MunicipalitySchema,
  MunicipalitiesSchema,
  getErrorSchemas,
  MunicipalityNameParamSchema,
  MunicipalitySectorEmissionsSchema,
} from '../../schemas'
import { municipalityService } from '../../services/municipalityService'
import { redisCache } from '../../..'
import fs from 'fs'
import apiConfig from '../../../config/api'

const MUNICIPALITIES_CACHE_KEY = 'municipalities:all'
const MUNICIPALITIES_TIMESTAMP_KEY = 'municipalities:timestamp'

const getDataFileTimestamp = (): number => {
  try {
    const stats = fs.statSync(apiConfig.municipalityDataPath)
    return stats.mtimeMs
  } catch (_) {
    return 0
  }
}

export async function internalMunicipalityReadRoutes(app: FastifyInstance) {
  app.register(cachePlugin)

  app.get(
    '/',
    {
      schema: {
        summary: 'Get all municipalities',
        description:
          'Retrieve a list of all municipalities with data about their emissions, carbon budget, climate plans, bike infrastructure, procurements, and much more. Returns 304 Not Modified if the resource has not changed since the last request (based on ETag).',
        tags: getTags('Internal'),

        response: {
          200: MunicipalitiesSchema,
        },
      },
    },
    async (request, reply) => {
      const currentTimestamp = getDataFileTimestamp()
      const etagValue = `"${currentTimestamp}"`

      const cachedMunicipalities = await redisCache.get(
        MUNICIPALITIES_CACHE_KEY
      )

      if (cachedMunicipalities) {
        return reply.header('ETag', etagValue).send(cachedMunicipalities)
      }

      const municipalities = await municipalityService.getMunicipalities()

      await redisCache.set(
        MUNICIPALITIES_CACHE_KEY,
        JSON.stringify(municipalities)
      )
      await redisCache.set(
        MUNICIPALITIES_TIMESTAMP_KEY,
        currentTimestamp.toString()
      )

      reply.header('ETag', etagValue).send(municipalities)
    }
  )

  app.get(
    '/:name',
    {
      schema: {
        summary: 'Get one municipality',
        description:
          'Retrieve a one municipality with data about their emissions, carbon budget, climate plans, bike infrastructure, procurements and much more.',
        tags: getTags('Municipalities'),
        params: MunicipalityNameParamSchema,
        response: {
          200: MunicipalitySchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: MunicipalityNameParams }>,
      reply
    ) => {
      const { name } = request.params
      const municipality = municipalityService.getMunicipality(name)

      if (!municipality) {
        return reply.status(404).send({
          code: 'NOT_FOUND',
          message: 'The requested resource could not be found.',
        })
      }

      reply.send(municipality)
    }
  )

  app.get(
    '/:name/sector-emissions',
    {
      schema: {
        summary: 'Get municipality sector emissions',
        description:
          'Retrieve sector emissions data for a specific municipality, broken down by different sectors over time.',
        tags: getTags('Municipalities'),
        params: MunicipalityNameParamSchema,
        response: {
          200: MunicipalitySectorEmissionsSchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: MunicipalityNameParams }>,
      reply
    ) => {
      const { name } = request.params
      const sectorEmissions =
        municipalityService.getMunicipalitySectorEmissions(name)

      if (!sectorEmissions) {
        return reply.status(404).send({
          code: 'NOT_FOUND',
          message: 'The requested resource could not be found.',
        })
      }

      reply.send({ sectors: sectorEmissions })
    }
  )
}
