import { AuthenticatedFastifyRequest, FastifyInstance } from 'fastify'

import { companyService } from '../../services/companyService'
import { tagOptionService } from '../../services/tagOptionService'
import {
  postCompanyBodySchema,
  patchCompanyTagsBodySchema,
  companyIdParamSchema,
  okResponseSchema,
  createCompanyResponseSchema,
  getErrorSchemas,
} from '../../schemas'
import { getTags } from '../../../config/openapi'
import { PostCompanyBody, CompanyIdParams } from '../../types'
import { metadataService } from '../../services/metadataService'
import { redisCache } from '../../../lib/redisCacheSingleton'

async function validateTags(
  tags: string[] | undefined,
  reply: { status: (code: number) => { send: (body: unknown) => unknown } }
): Promise<boolean> {
  if (tags !== undefined && tags.length > 0) {
    const validSlugs = await tagOptionService.getAllSlugs()
    const invalid = tags.filter((t) => !validSlugs.includes(t))
    if (invalid.length > 0) {
      reply.status(400).send({
        code: '400',
        message: `Invalid tag(s). Each tag must be a valid tag option slug: ${invalid.join(', ')}`,
        details: { invalidTags: invalid },
      })
      return false
    }
  }
  return true
}

async function saveCompanyDescriptions(
  request: AuthenticatedFastifyRequest<{ Body: PostCompanyBody }>,
  companyId: string
) {
  const { descriptions, metadata } = request.body

  await Promise.all(
    (descriptions ?? []).map(async (description) => {
      const createdMetadata = await metadataService.createMetadata({
        user: request.user,
        metadata,
      })
      await companyService.upsertDescription({
        description,
        companyId,
        metadataId: createdMetadata.id,
      })
    })
  )
}

export async function companyUpdateRoutes(app: FastifyInstance) {
  app.post(
    '/',
    {
      schema: {
        summary: 'Create a company',
        description:
          'Creates a new company. wikidataId is optional; companies can be created with name only.',
        tags: getTags('Internal'),
        body: postCompanyBodySchema,
        response: {
          200: createCompanyResponseSchema,
          ...getErrorSchemas(400, 404, 409, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Body: PostCompanyBody }>,
      reply
    ) => {
      const { wikidataId, tags, name, internalComment, url, logoUrl, lei } =
        request.body
      if (!(await validateTags(tags, reply))) return

      try {
        const company = await companyService.createCompany({
          name,
          wikidataId,
          internalComment,
          tags,
          url,
          logoUrl: logoUrl ?? undefined,
          lei,
          user: request.user,
        })
        await saveCompanyDescriptions(request, company.id)
        redisCache.clear()
        return reply.send({ ok: true, id: company.id })
      } catch (error) {
        if ((error as { code?: number }).code === 409) {
          return reply.status(409).send({
            code: '409',
            message:
              error instanceof Error
                ? error.message
                : 'Wikidata ID is already in use',
          })
        }
        console.error('ERROR Creation of company failed:', error)
        return reply.status(500).send({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Creation of company failed.',
        })
      }
    }
  )

  app.post(
    '/:id',
    {
      schema: {
        summary: 'Update a company',
        description:
          'Updates an existing company by internal id. Body may include wikidataId to change the company Wikidata identifier.',
        tags: getTags('Internal'),
        params: companyIdParamSchema,
        body: postCompanyBodySchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 409, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: CompanyIdParams
        Body: PostCompanyBody
      }>,
      reply
    ) => {
      const { id } = request.params
      const {
        tags,
        wikidataId: bodyWikidataId,
        name,
        internalComment,
        url,
        logoUrl,
        lei,
        metadata,
        verified,
        verifiedByUserId,
      } = request.body
      if (!(await validateTags(tags, reply))) return

      try {
        const existing = await companyService.getCompanyByInternalId(id)

        if (bodyWikidataId && bodyWikidataId !== existing.wikidataId) {
          await companyService.updateCompanyWikidataIdentifier(
            existing.id,
            bodyWikidataId,
            request.user,
            { verified, metadata, verifiedByUserId }
          )
        } else if (
          bodyWikidataId &&
          (metadata || verified || verifiedByUserId)
        ) {
          await companyService.updateCompanyWikidataIdentifier(
            existing.id,
            bodyWikidataId,
            request.user,
            { verified, metadata, verifiedByUserId }
          )
        }

        const company = await companyService.updateCompanyById(
          id,
          {
            name,
            internalComment,
            tags,
            url,
            logoUrl: logoUrl ?? undefined,
            lei,
          },
          request.user
        )
        await saveCompanyDescriptions(request, company.id)
        redisCache.clear()
        return reply.send({ ok: true })
      } catch (error) {
        if ((error as { code?: number }).code === 409) {
          return reply.status(409).send({
            code: '409',
            message:
              error instanceof Error
                ? error.message
                : 'Wikidata ID is already in use',
          })
        }
        console.error('ERROR Update of company failed:', error)
        return reply.status(500).send({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Update of company failed.',
        })
      }
    }
  )

  app.patch(
    '/:id/tags',
    {
      schema: {
        summary: 'Update company tags',
        description:
          'Replaces the company tags. Each tag must be a valid tag option slug.',
        tags: getTags('Internal'),
        params: companyIdParamSchema,
        body: patchCompanyTagsBodySchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: CompanyIdParams
        Body: { tags: string[] }
      }>,
      reply
    ) => {
      const { id } = request.params
      const { tags } = request.body
      if (!(await validateTags(tags, reply))) return

      try {
        const company = await companyService.getCompanyByInternalId(id)
        await companyService.updateCompanyTags(company.id, tags)
        redisCache.clear()
        return reply.send({ ok: true })
      } catch {
        return reply.status(404).send({
          code: '404',
          message: 'Company not found',
        })
      }
    }
  )
}
