import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'

import { baseYearService } from '../services/baseYearService'
import {
  wikidataIdParamSchema,
  okResponseSchema,
  garboEntityIdSchema,
  getErrorSchemas,
  postBaseYear,
} from '../schemas'
import { GarboEntityId, PostBaseYearBody, WikidataIdParams } from '../types'
import { metadataService } from '../services/metadataService'
import { getTags } from '../../config/openapi'
import { z } from 'zod'

export async function companyBaseYearRoutes(app: FastifyInstance) {
  app.post(
    '/:wikidataId/baseYear',
    {
      schema: {
        summary: 'Set company base year',
        description: 'Create or set the base year for a company',
        tags: getTags('BaseYear'),
        params: wikidataIdParamSchema,
        body: postBaseYear,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: WikidataIdParams
        Body: PostBaseYearBody
      }>,
      reply
    ) => {
      const { baseYear, metadata } = request.body
      const { wikidataId } = request.params
      const user = request.user

      await baseYearService.createBaseYear(wikidataId, baseYear, () =>
        metadataService.createMetadata({
          metadata,
          user,
        })
      )

      reply.send({ ok: true })
    }
  )

  app.patch(
    '/:wikidataId/baseYear/:id',
    {
      schema: {
        summary: 'Update company base year',
        description: 'Update the base year for a company',
        tags: getTags('BaseYear'),
        params: garboEntityIdSchema,
        body: postBaseYear,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: GarboEntityId
        Body: PostBaseYearBody
      }>,
      reply
    ) => {
      const { id } = request.params
      const { baseYear } = request.body

      const createdMetadata = await metadataService.createMetadata({
        metadata: request.body.metadata,
        user: request.user,
      })

      await baseYearService.updateBaseYear(id, { baseYear }, createdMetadata)

      reply.send({ ok: true })
    }
  )
}
