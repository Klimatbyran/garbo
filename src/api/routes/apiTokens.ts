import { FastifyInstance, FastifyRequest } from 'fastify'
import { getTags } from '../../config/openapi'
import {
  createApiTokenBodySchema,
  updateApiTokenBodySchema,
  apiTokenIdParamSchema,
} from '../schemas'
import {
  ApiTokenListSchema,
  CreateApiTokenResponseSchema,
  ApiTokenSchema,
  getErrorSchemas,
} from '../schemas'
import { apiTokenService } from '../services/apiTokenService'
import { z } from 'zod'

type CreateApiTokenBody = z.infer<typeof createApiTokenBodySchema>
type UpdateApiTokenBody = z.infer<typeof updateApiTokenBodySchema>
type ApiTokenIdParams = z.infer<typeof apiTokenIdParamSchema>

export async function apiTokenRoutes(app: FastifyInstance) {
  // List all API tokens
  app.get(
    '/',
    {
      schema: {
        summary: 'List all API tokens',
        description: 'Retrieve a list of all API tokens (token values are not returned)',
        tags: getTags('API Tokens'),
        response: {
          200: ApiTokenListSchema,
          ...getErrorSchemas(401),
        },
      },
    },
    async (request, reply) => {
      const tokens = await apiTokenService.getAllTokens()
      reply.send(tokens)
    },
  )

  // Create a new API token
  app.post(
    '/',
    {
      schema: {
        summary: 'Create a new API token',
        description:
          'Create a new API token with specified permissions. The token value is only returned once upon creation.',
        tags: getTags('API Tokens'),
        body: createApiTokenBodySchema,
        response: {
          201: CreateApiTokenResponseSchema,
          ...getErrorSchemas(400, 401),
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: CreateApiTokenBody }>,
      reply,
    ) => {
      const { name, permissions, expiresAt } = request.body
      const { token, apiToken } = await apiTokenService.createToken(
        name,
        permissions,
        expiresAt,
      )
      reply.status(201).send({ token, apiToken })
    },
  )

  // Get a specific API token by ID
  app.get(
    '/:id',
    {
      schema: {
        summary: 'Get API token by ID',
        description: 'Retrieve details of a specific API token (token value is not returned)',
        tags: getTags('API Tokens'),
        params: apiTokenIdParamSchema,
        response: {
          200: ApiTokenSchema,
          ...getErrorSchemas(401, 404),
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: ApiTokenIdParams }>,
      reply,
    ) => {
      const { id } = request.params
      const apiToken = await apiTokenService.getTokenById(id)

      if (!apiToken) {
        return reply.status(404).send({
          code: 'NOT_FOUND',
          message: 'API token not found',
        })
      }

      reply.send(apiToken)
    },
  )

  // Update an API token
  app.patch(
    '/:id',
    {
      schema: {
        summary: 'Update API token',
        description: 'Update an API token (name, permissions, expiration, or active status)',
        tags: getTags('API Tokens'),
        params: apiTokenIdParamSchema,
        body: updateApiTokenBodySchema,
        response: {
          200: ApiTokenSchema,
          ...getErrorSchemas(400, 401, 404),
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: ApiTokenIdParams
        Body: UpdateApiTokenBody
      }>,
      reply,
    ) => {
      const { id } = request.params
      const updateData = request.body

      const existingToken = await apiTokenService.getTokenById(id)
      if (!existingToken) {
        return reply.status(404).send({
          code: 'NOT_FOUND',
          message: 'API token not found',
        })
      }

      const updatedToken = await apiTokenService.updateToken(id, updateData)
      reply.send(updatedToken)
    },
  )

  // Delete an API token
  app.delete(
    '/:id',
    {
      schema: {
        summary: 'Delete API token',
        description: 'Permanently delete an API token',
        tags: getTags('API Tokens'),
        params: apiTokenIdParamSchema,
        response: {
          204: z.undefined(),
          ...getErrorSchemas(401, 404),
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: ApiTokenIdParams }>,
      reply,
    ) => {
      const { id } = request.params

      const existingToken = await apiTokenService.getTokenById(id)
      if (!existingToken) {
        return reply.status(404).send({
          code: 'NOT_FOUND',
          message: 'API token not found',
        })
      }

      await apiTokenService.deleteToken(id)
      reply.status(204).send()
    },
  )
}
