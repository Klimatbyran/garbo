import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'
import type { TagOptionType } from '@prisma/client'

import { tagOptionService } from '../services/tagOptionService'
import {
  createTagOptionBodySchema,
  updateTagOptionBodySchema,
  tagOptionIdParamSchema,
  tagOptionListQuerySchema,
  okResponseSchema,
  getErrorSchemas,
  tagOptionSchema,
  tagOptionListResponseSchema,
} from '../schemas'
import { getTags } from '../../config/openapi'

export async function tagOptionsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      schema: {
        summary: 'List tag options',
        description: 'Returns all valid tag options for company tags',
        tags: getTags('TagOptions'),
        querystring: tagOptionListQuerySchema,
        response: {
          200: tagOptionListResponseSchema,
          ...getErrorSchemas(500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Querystring: { type?: string }
      }>,
      reply
    ) => {
      const options = await tagOptionService.findAll(
        request.query.type as Parameters<typeof tagOptionService.findAll>[0]
      )
      return reply.send(options)
    }
  )

  app.post(
    '/',
    {
      schema: {
        summary: 'Create tag option',
        description: 'Add a new valid tag option. Slug must be unique.',
        tags: getTags('TagOptions'),
        body: createTagOptionBodySchema,
        response: {
          200: tagOptionSchema,
          ...getErrorSchemas(400, 409, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Body: { slug: string; label?: string; type?: string }
      }>,
      reply
    ) => {
      const { slug, label, type } = request.body
      const existing = await tagOptionService.findBySlug(slug)
      if (existing) {
        return reply.status(409).send({
          code: '409',
          message: `Tag option with slug "${slug}" already exists`,
        })
      }
      const created = await tagOptionService.create({
        slug,
        label,
        type: type as TagOptionType | undefined,
      })
      return reply.send(created)
    }
  )

  app.patch(
    '/:id',
    {
      schema: {
        summary: 'Update tag option',
        description:
          'Update slug and/or label. If slug changes, company tags are updated to the new slug.',
        tags: getTags('TagOptions'),
        params: tagOptionIdParamSchema,
        body: updateTagOptionBodySchema,
        response: {
          200: tagOptionSchema,
          ...getErrorSchemas(400, 404, 409, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: { id: string }
        Body: { slug?: string; label?: string | null; type?: string }
      }>,
      reply
    ) => {
      const { id } = request.params
      const body = request.body
      const existing = await tagOptionService.findById(id)
      if (!existing) {
        return reply.status(404).send({
          code: '404',
          message: 'Tag option not found',
        })
      }
      if (body.slug !== undefined && body.slug !== existing.slug) {
        const slugTaken = await tagOptionService.findBySlug(body.slug)
        if (slugTaken) {
          return reply.status(409).send({
            code: '409',
            message: `Tag option with slug "${body.slug}" already exists`,
          })
        }
      }
      const updated = await tagOptionService.update(id, {
        slug: body.slug,
        label: body.label,
        type: body.type as Parameters<
          typeof tagOptionService.update
        >[1]['type'],
      })
      return reply.send(updated)
    }
  )

  app.delete(
    '/:id',
    {
      schema: {
        summary: 'Delete tag option',
        description:
          'Deletes the tag option and removes it from all companies that had this tag.',
        tags: getTags('TagOptions'),
        params: tagOptionIdParamSchema,
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
        await tagOptionService.delete(id)
        return reply.send({ ok: true })
      } catch (error: any) {
        if (error?.code === 'P2025') {
          return reply.status(404).send({
            code: '404',
            message: 'Tag option not found',
          })
        }
        throw error
      }
    }
  )
}
