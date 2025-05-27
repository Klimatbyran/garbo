import { FastifyInstance, FastifyRequest } from 'fastify'
import { redisCache } from '../..'
import { okResponseSchema, wikidataIdParamSchema } from '../schemas'
import { ValidationClaims, WikidataIdParams } from '../types'
import { validationClaimsCacheKey } from './validation.read'

export async function validationsUpdateRoutes(app: FastifyInstance) {
  app.post(
    '/claims/:wikidataId',
    {
      schema: {
        summary: 'Claim a company',
        description: 'Claim stuff',
        tags: ['ReportValidations'],
        params: wikidataIdParamSchema,
        response: {
          200: okResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: WikidataIdParams
      }>,
      reply
    ) => {
      const { wikidataId } = request.params
      try {
        const storedClaims: ValidationClaims =
          (await redisCache.get(validationClaimsCacheKey)) ?? {}

        // TODO: Read from token
        //  const user = request.user
        storedClaims[wikidataId] = 'hallski'
        await redisCache.set(
          validationClaimsCacheKey,
          JSON.stringify(storedClaims)
        )

        return reply.send({ ok: true })
      } catch (error) {
        console.error('Get validation claims error:', error)
        return reply
          .status(500)
          .send({ error: 'Failed to fetch validation claims' })
      }
    }
  )

  app.delete(
    '/claims/:wikidataId',
    {
      schema: {
        summary: 'Delete a claim',
        description: 'Claim stuff',
        tags: ['ReportValidations'],
        params: wikidataIdParamSchema,
        response: {
          200: okResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: WikidataIdParams
      }>,
      reply
    ) => {
      const { wikidataId } = request.params
      try {
        const storedClaims: ValidationClaims =
          (await redisCache.get(validationClaimsCacheKey)) ?? {}

        // TODO: Read from token
        //  const user = request.user
        if (storedClaims[wikidataId] === 'hallski') {
          delete storedClaims[wikidataId]
          await redisCache.set(
            validationClaimsCacheKey,
            JSON.stringify(storedClaims)
          )
        } else {
          return reply.status(401).send({ error: 'Not the claim owner' })
        }

        return reply.send({ ok: true })
      } catch (error) {
        console.error('Get validation claims error:', error)
        return reply
          .status(500)
          .send({ error: 'Failed to fetch validation claims' })
      }
    }
  )
}
