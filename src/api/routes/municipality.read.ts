import { FastifyInstance, FastifyRequest } from 'fastify'

import { getTags } from '../../config/openapi'
import { MunicipalityNameParams } from '../types'
import { cachePlugin } from '../plugins/cache'
import {
  MunicipalitySchema,
  MunicipalitiesSchema,
  getErrorSchemas,
  MunicipalityNameParamSchema,
} from '../schemas'
import { municipalityService } from '../services/municipalityService'
import { redisCache } from '../..'

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
      const cacheKey = 'municipalities:data'
      const clientEtag = request.headers['if-none-match']

      const eTag = 'static-etag-for-municipalities'

      if (clientEtag === eTag) return reply.code(304).send()

      let municipalities = await redisCache.get(cacheKey)

      if (municipalities) {
        municipalities = JSON.parse(municipalities)
      } else {
        municipalities = municipalityService.getMunicipalities()
        await redisCache.set(cacheKey, JSON.stringify(municipalities))
      }

      reply.header('ETag', eTag)
      reply.send(municipalities)
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
}
