import { AuthenticatedFastifyRequest, FastifyInstance } from 'fastify'

import { companyService } from '../services/companyService'
import { tagOptionService } from '../services/tagOptionService'
import {
  postCompanyBodySchema,
  patchCompanyTagsBodySchema,
  wikidataIdParamSchema,
  okResponseSchema,
  getErrorSchemas,
} from '../schemas'
import { getTags } from '../../config/openapi'
import { PostCompanyBody, WikidataIdParams } from '../types'
import { metadataService } from '../services/metadataService'

export async function companyUpdateRoutes(app: FastifyInstance) {
  app.post(
    '/:wikidataId',
    {
      schema: {
        summary: 'Create or update a company',
        description:
          'Creates a new company or updates an existing one based on wikidataId',
        tags: getTags('Companies'),
        body: postCompanyBodySchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: WikidataIdParams
        Body: PostCompanyBody
      }>,
      reply,
    ) => {
      const {
        name,
        wikidataId,
        descriptions,
        internalComment,
        tags,
        url,
        logoUrl,
        lei,
        metadata,
      } = request.body
      if (tags !== undefined && tags.length > 0) {
        const validSlugs = await tagOptionService.getAllSlugs()
        const invalid = tags.filter((t) => !validSlugs.includes(t))
        if (invalid.length > 0) {
          return reply.status(400).send({
            code: '400',
            message: `Invalid tag(s). Each tag must be a valid tag option slug: ${invalid.join(', ')}`,
            details: { invalidTags: invalid },
          })
        }
      }
      try {
        await companyService.upsertCompany({
          name,
          wikidataId,
          internalComment,
          tags,
          url,
          logoUrl,
          lei,
        })
        // Create descriptions
        descriptions?.map(async (description) => {
          const createdMetadata = await metadataService.createMetadata({
            user: request.user,
            metadata,
          })
          await companyService.upsertDescription({
            description,
            companyId: wikidataId,
            metadataId: createdMetadata.id,
          })
        })
        return reply.send({ ok: true })
      } catch (error) {
        console.error('ERROR Creation or update of company failed:', error)
        return reply
          .status(500)
          .send({ message: 'Creation or update of company failed.' })
      }
    },
  )

  app.patch(
    '/:wikidataId/tags',
    {
      schema: {
        summary: 'Update company tags',
        description:
          'Replaces the company tags. Each tag must be a valid tag option slug.',
        tags: getTags('Companies'),
        params: wikidataIdParamSchema,
        body: patchCompanyTagsBodySchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: WikidataIdParams
        Body: { tags: string[] }
      }>,
      reply
    ) => {
      const { wikidataId } = request.params
      const { tags } = request.body
      if (tags.length > 0) {
        const validSlugs = await tagOptionService.getAllSlugs()
        const invalid = tags.filter((t) => !validSlugs.includes(t))
        if (invalid.length > 0) {
          return reply.status(400).send({
            code: '400',
            message: `Invalid tag(s). Each tag must be a valid tag option slug: ${invalid.join(', ')}`,
            details: { invalidTags: invalid },
          })
        }
      }
      try {
        await companyService.getCompany(wikidataId)
      } catch {
        return reply.status(404).send({
          code: '404',
          message: 'Company not found',
        })
      }
      await companyService.updateCompanyTags(wikidataId, tags)
      return reply.send({ ok: true })
    }
  )
}
