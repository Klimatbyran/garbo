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

export async function municipalityReadRoutes(app: FastifyInstance) {
  app.register(cachePlugin)

  app.get(
    '/',
    {
      schema: {
        summary: 'Get all municipalities',
        description:
          'Retrieve a list of all municipalities with data about their emissions, carbon budget, climate plans, bike infrastructure, procurements and much more.',
        tags: getTags('Municipalities'),

        response: {
          200: MunicipalitiesSchema,
        },
      },
    },
    async (request, reply) => {
      reply.send(municipalityService.getMunicipalities())
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
      // IDEA: Maybe add custom swagger transform to document the endpoint?
      config: {
        swaggerTransform({ schema, url, route, ...documentObject }) {
          console.dir(schema, { colors: true, depth: 6 })
          return { schema, url }
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
        // NOTE: Maybe keep common errors in one place to re-use the same strings
        return reply.status(404).send({
          code: 'NOT_FOUND',
          message: 'The requested resource could not be found.',
        })
      }

      reply.send(municipality)
    }
  )
}
