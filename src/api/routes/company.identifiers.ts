import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'
import { identifierService } from '../services/identifierService'
import { metadataService } from '../services/metadataService'
import {
  wikidataIdParamSchema,
  okResponseSchema,
  getErrorSchemas,
} from '../schemas'
import {
  postIdentifiersBodySchema,
  updateIdentifierBodySchema,
  PostIdentifiersBody,
  UpdateIdentifierBody,
} from '../schemas/identifier'
import { getTags } from '../../config/openapi'
import { WikidataIdParams } from '../types'

export async function companyIdentifiersRoutes(app: FastifyInstance) {
  app.post(
    '/:wikidataId/identifiers',
    {
      schema: {
        summary: 'Create or update company identifiers',
        description: 'Create or update multiple identifiers for a company',
        tags: getTags('Companies'),
        params: wikidataIdParamSchema,
        body: postIdentifiersBodySchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: WikidataIdParams
        Body: PostIdentifiersBody
      }>,
      reply,
    ) => {
      const { wikidataId } = request.params
      const { identifiers, metadata } = request.body

      try {
        const createdMetadata = await metadataService.createMetadata({
          metadata,
          user: request.user,
        })

        await Promise.all(
          identifiers.map((identifier: any) =>
            identifierService.upsertIdentifier(
              wikidataId,
              identifier.type,
              identifier.value,
              createdMetadata,
            ),
          ),
        )

        return reply.send({ ok: true })
      } catch (error) {
        console.error('Error creating/updating identifiers:', error)
        return reply.status(500).send({
          code: '500',
          message: 'Failed to create/update identifiers',
        })
      }
    },
  )

  app.patch(
    '/:wikidataId/identifiers/:type',
    {
      schema: {
        summary: 'Update a specific identifier',
        description: 'Update a specific identifier type for a company',
        tags: getTags('Companies'),
        params: {
          type: 'object',
          properties: {
            wikidataId: { type: 'string' },
            type: { type: 'string' },
          },
          required: ['wikidataId', 'type'],
        },
        body: updateIdentifierBodySchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: { wikidataId: string; type: string }
        Body: UpdateIdentifierBody
      }>,
      reply,
    ) => {
      const { wikidataId, type } = request.params
      const { value, metadata } = request.body

      try {
        const createdMetadata = await metadataService.createMetadata({
          metadata,
          user: request.user,
        })

        await identifierService.updateIdentifier(
          wikidataId,
          type,
          value,
          createdMetadata,
        )

        return reply.send({ ok: true })
      } catch (error) {
        console.error('Error updating identifier:', error)
        return reply.status(500).send({
          code: '500',
          message: 'Failed to update identifier',
        })
      }
    },
  )
}
