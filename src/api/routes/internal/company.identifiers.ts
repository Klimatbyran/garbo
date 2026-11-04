import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'
import { z } from 'zod'

import { companyService } from '../../services/companyService'
import {
  companyIdParamSchema,
  companyIdentifierDeleteParamsSchema,
  companyIdentifierDeleteQuerySchema,
  okResponseSchema,
  emptyBodySchema,
  getErrorSchemas,
  postCompanyIdentifierSchema,
  postCompanyIdentifiersBatchSchema,
} from '../../schemas'
import {
  PostCompanyIdentifierBody,
  CompanyIdParams,
  CompanyIdentifierDeleteParams,
} from '../../types'
import { getTags } from '../../../config/openapi'
import { redisCache } from '../../../lib/redisCacheSingleton'

type PostCompanyIdentifiersBatchBody = z.infer<
  typeof postCompanyIdentifiersBatchSchema
>
type CompanyIdentifierDeleteQuery = z.infer<
  typeof companyIdentifierDeleteQuerySchema
>

export async function companyIdentifierRoutes(app: FastifyInstance) {
  app.post(
    '/:id/identifiers',
    {
      schema: {
        summary: 'Upsert a company identifier',
        description:
          'Create or update a company identifier (WIKIDATA, LEI, ORG_NUMBER, ISIN, BIC). Multi-valued types (ISIN, BIC) upsert by value. Optional role=PRIMARY. Dual-writes legacy wikidataId/lei columns when applicable. Empty value clears singular types only; for ISIN/BIC use DELETE with ?value=.',
        tags: getTags('Internal'),
        params: companyIdParamSchema,
        body: postCompanyIdentifierSchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 409, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: CompanyIdParams
        Body: PostCompanyIdentifierBody
      }>,
      reply
    ) => {
      const { id } = request.params
      const { type, value, metadata, verified, role } = request.body
      const trimmedValue = value.trim()

      try {
        await companyService.getCompanyByInternalId(id)
        if (!trimmedValue) {
          if (type === 'WIKIDATA') {
            return reply.status(400).send({
              code: '400',
              message:
                'Wikidata identifier cannot be cleared via this endpoint',
            })
          }
          if (type === 'ISIN' || type === 'BIC') {
            return reply.status(400).send({
              code: '400',
              message:
                'Clearing ISIN/BIC requires DELETE with ?value= to remove a single row',
            })
          }
          await companyService.deleteCompanyIdentifier(id, type)
          redisCache.clear()
          return reply.send({ ok: true })
        }

        await companyService.upsertCompanyIdentifier(
          id,
          type,
          trimmedValue,
          request.user,
          { metadata, verified, role }
        )
        redisCache.clear()
        return reply.send({ ok: true })
      } catch (error) {
        const code = (error as { code?: number }).code
        if (code === 400) {
          return reply.status(400).send({
            code: '400',
            message:
              error instanceof Error
                ? error.message
                : 'Invalid identifier request',
          })
        }
        if (code === 409) {
          return reply.status(409).send({
            code: '409',
            message:
              error instanceof Error
                ? error.message
                : 'Identifier value is already in use',
          })
        }
        if ((error as { code?: string }).code === 'P2025') {
          return reply.status(404).send({
            code: '404',
            message: 'Company not found',
          })
        }
        console.error('ERROR Upsert of company identifier failed:', error)
        return reply.status(500).send({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Upsert of company identifier failed.',
        })
      }
    }
  )

  app.post(
    '/:id/identifiers/batch',
    {
      schema: {
        summary: 'Batch upsert company identifiers',
        description:
          'Pipeline helper: upsert many ISIN/BIC/ORG_NUMBER rows from GLEIF in one request. Ownership conflicts are skipped per item. ORG_NUMBER is create-only (never overwrites).',
        tags: getTags('Internal'),
        params: companyIdParamSchema,
        body: postCompanyIdentifiersBatchSchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 409, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: CompanyIdParams
        Body: PostCompanyIdentifiersBatchBody
      }>,
      reply
    ) => {
      const { id } = request.params
      const { items, metadata, verified } = request.body

      try {
        await companyService.getCompanyByInternalId(id)
        await companyService.upsertCompanyIdentifiersBatch(
          id,
          items,
          request.user,
          { metadata, verified }
        )
        redisCache.clear()
        return reply.send({ ok: true })
      } catch (error) {
        const code = (error as { code?: number }).code
        if (code === 400) {
          return reply.status(400).send({
            code: '400',
            message:
              error instanceof Error
                ? error.message
                : 'Invalid identifier request',
          })
        }
        if (code === 409) {
          return reply.status(409).send({
            code: '409',
            message:
              error instanceof Error
                ? error.message
                : 'Identifier value is already in use',
          })
        }
        if ((error as { code?: string }).code === 'P2025') {
          return reply.status(404).send({
            code: '404',
            message: 'Company not found',
          })
        }
        console.error(
          'ERROR Batch upsert of company identifiers failed:',
          error
        )
        return reply.status(500).send({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Batch upsert of company identifiers failed.',
        })
      }
    }
  )

  app.delete(
    '/:id/identifiers/:type',
    {
      schema: {
        summary: 'Clear a company identifier type or value',
        description:
          'Without ?value=, removes all rows of the given type (not allowed for ISIN/BIC — pass ?value=). LEI also clears the legacy Company.lei column. Wikidata cannot be cleared via this endpoint.',
        tags: getTags('Internal'),
        params: companyIdentifierDeleteParamsSchema,
        querystring: companyIdentifierDeleteQuerySchema,
        response: {
          204: emptyBodySchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: CompanyIdentifierDeleteParams
        Querystring: CompanyIdentifierDeleteQuery
      }>,
      reply
    ) => {
      const { id, type } = request.params
      const value = request.query.value?.trim()

      try {
        await companyService.getCompanyByInternalId(id)
        if (value) {
          await companyService.deleteCompanyIdentifierValue(id, type, value)
        } else if (type === 'ISIN' || type === 'BIC') {
          return reply.status(400).send({
            code: '400',
            message:
              'Deleting ISIN/BIC requires ?value= to remove a single row',
          })
        } else {
          await companyService.deleteCompanyIdentifier(id, type)
        }
        redisCache.clear()
        return reply.code(204).send()
      } catch (error) {
        const code = (error as { code?: number }).code
        if (code === 400) {
          return reply.status(400).send({
            code: '400',
            message:
              error instanceof Error
                ? error.message
                : 'Invalid identifier request',
          })
        }
        if (code === 404) {
          return reply.status(404).send({
            code: '404',
            message:
              error instanceof Error ? error.message : 'Identifier not found',
          })
        }
        if ((error as { code?: string }).code === 'P2025') {
          return reply.status(404).send({
            code: '404',
            message: 'Company not found',
          })
        }
        console.error('ERROR Deletion of company identifier failed:', error)
        return reply.status(500).send({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Deletion of company identifier failed.',
        })
      }
    }
  )
}
