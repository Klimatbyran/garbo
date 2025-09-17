import { FastifyInstance, FastifyRequest } from 'fastify'
import { getTags } from '../../config/openapi'
import { MunicipalityNameParams } from '../types'
import { cachePlugin } from '../plugins/cache'
import {
  MunicipalitySchema,
  MunicipalitiesSchema,
  getErrorSchemas,
  MunicipalityNameParamSchema,
  MunicipalitySectorEmissionsSchema,
} from '../schemas'
import { municipalityService } from '../services/municipalityService'
import { redisCache } from '../..'
import apiConfig from '@/config/api'

const unknownVersion = { major: '0', minor: '0' }

const getVersionParts = (
  versionString: string,
): { major: string; minor: string } => {
  const versionMatch = versionString.match(/^[vV]?(\d+)\.(\d+).*$|^(\d+)$/)

  if (versionMatch) {
    return {
      major: versionMatch[1] || versionMatch[3] || 'unknown',
      minor: versionMatch[2] || '0',
    }
  }

  return unknownVersion
}

export async function municipalityReadRoutes(app: FastifyInstance) {
  app.register(cachePlugin)

  app.get(
    '/',
    {
      schema: {
        summary: 'Get all municipalities',
        description:
          'Retrieve a list of all municipalities with data about their emissions, carbon budget, climate plans, bike infrastructure, procurements, and much more.',
        tags: getTags('Municipalities'),

        response: {
          200: MunicipalitiesSchema,
        },
      },
    },
    async (request, reply) => {
      // For development purposes, we can return the municipalities directly
      if (apiConfig.nodeEnv === 'development') {
        const municipalities = await municipalityService.getMunicipalities()
        reply.send(municipalities)
        return
      }

      const clientEtag = request.headers['if-none-match']
      const cacheKey = 'municipalities:etag'

      let currentEtag: string = await redisCache.get(cacheKey)

      const packageVersion = process.env.npm_package_version
      const { major, minor } = packageVersion
        ? getVersionParts(packageVersion)
        : unknownVersion

      const versionKey = `${major}.${minor}`

      if (!currentEtag || !currentEtag.startsWith(versionKey)) {
        const oldVersion = currentEtag ? currentEtag.split('-')[0] : null

        if (oldVersion && oldVersion !== versionKey) {
          const oldDataCacheKey = `municipalities:data:${oldVersion}`
          await redisCache.delete(oldDataCacheKey)
        }

        currentEtag = `${versionKey}-${new Date().toISOString()}`
        await redisCache.set(cacheKey, currentEtag)
      }

      if (clientEtag === currentEtag) return reply.code(304).send()

      const dataCacheKey = `municipalities:data:${versionKey}`

      let municipalities = await redisCache.get(dataCacheKey)

      if (!municipalities) {
        municipalities = await municipalityService.getMunicipalities()
        await redisCache.set(dataCacheKey, JSON.stringify(municipalities))
      }

      reply.header('ETag', `${currentEtag}`)

      reply.send(municipalities)
    },
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
      reply,
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
    },
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
      reply,
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
    },
  )
}
