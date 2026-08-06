import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'

import { reportTypeService } from '../services/reportTypeService'
import { redisCache } from '@/lib/redisCacheSingleton'
import { invalidateRegistryCache } from '@/api/services/registryCache'
import {
  createReportTypeBodySchema,
  updateReportTypeBodySchema,
  reportTypeIdParamSchema,
  okResponseSchema,
  getErrorSchemas,
  reportTypeSchema,
  reportTypeListResponseSchema,
} from '../schemas'
import { getTags } from '../../config/openapi'

export async function reportTypesRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      schema: {
        summary: 'List report types',
        description: 'Returns all valid report types for registry reports',
        tags: getTags('ReportTypes'),
        response: {
          200: reportTypeListResponseSchema,
          ...getErrorSchemas(500),
        },
      },
    },
    async (_request, reply) => {
      const options = await reportTypeService.findAll()
      return reply.send(options)
    }
  )

  app.post(
    '/',
    {
      schema: {
        summary: 'Create report type',
        description: 'Add a new valid report type. Slug must be unique.',
        tags: getTags('ReportTypes'),
        body: createReportTypeBodySchema,
        response: {
          200: reportTypeSchema,
          ...getErrorSchemas(400, 409, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Body: { slug: string; label?: string }
      }>,
      reply
    ) => {
      const { slug, label } = request.body
      const existing = await reportTypeService.findBySlug(slug)
      if (existing) {
        return reply.status(409).send({
          code: '409',
          message: `Report type with slug "${slug}" already exists`,
        })
      }
      const created = await reportTypeService.create({ slug, label })
      return reply.send(created)
    }
  )

  app.patch(
    '/:id',
    {
      schema: {
        summary: 'Update report type',
        description: 'Update slug and/or label for a report type.',
        tags: getTags('ReportTypes'),
        params: reportTypeIdParamSchema,
        body: updateReportTypeBodySchema,
        response: {
          200: reportTypeSchema,
          ...getErrorSchemas(400, 404, 409, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: { id: string }
        Body: { slug?: string; label?: string | null }
      }>,
      reply
    ) => {
      const { id } = request.params
      const body = request.body
      const existing = await reportTypeService.findById(id)
      if (!existing) {
        return reply.status(404).send({
          code: '404',
          message: 'Report type not found',
        })
      }
      if (body.slug !== undefined && body.slug !== existing.slug) {
        const slugTaken = await reportTypeService.findBySlug(body.slug)
        if (slugTaken) {
          return reply.status(409).send({
            code: '409',
            message: `Report type with slug "${body.slug}" already exists`,
          })
        }
      }
      try {
        const updated = await reportTypeService.update(id, {
          slug: body.slug,
          label: body.label,
        })
        return reply.send(updated)
      } catch (error: any) {
        if (error?.code === 'P2025') {
          return reply.status(404).send({
            code: '404',
            message: 'Report type not found',
          })
        }
        throw error
      }
    }
  )

  app.delete(
    '/:id',
    {
      schema: {
        summary: 'Delete report type',
        description:
          'Deletes the report type and clears it from all registry reports that used it.',
        tags: getTags('ReportTypes'),
        params: reportTypeIdParamSchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: { id: string } }>,
      reply
    ) => {
      const { id } = request.params
      try {
        await reportTypeService.delete(id)
        await invalidateRegistryCache(redisCache, request.log)
        return reply.send({ ok: true })
      } catch (error: any) {
        if (error?.code === 'P2025') {
          return reply.status(404).send({
            code: '404',
            message: 'Report type not found',
          })
        }
        throw error
      }
    }
  )
}
