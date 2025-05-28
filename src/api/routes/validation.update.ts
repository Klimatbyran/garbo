import { FastifyInstance, FastifyRequest } from 'fastify'
import { redisCache } from '../..'
import {
  claimValidationSchema,
  okResponseSchema,
  wikidataIdParamSchema,
} from '../schemas'
import { ClaimValidation, ValidationClaims, WikidataIdParams } from '../types'
import { validationClaimsCacheKey } from './validation.read'

export async function validationsUpdateRoutes(app: FastifyInstance) {
  app.post(
    '/claim/:wikidataId',
    {
      schema: {
        summary: 'Claim a company',
        description: 'Used to claim that a company report is being worked on',
        tags: ['ReportValidations'],
        params: wikidataIdParamSchema,
        body: claimValidationSchema,
        response: {
          200: okResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: WikidataIdParams
        Body: ClaimValidation
      }>,
      reply
    ) => {
      const { wikidataId } = request.params
      const { steal } = request.body

      try {
        const storedClaims: ValidationClaims =
          (await redisCache.get(validationClaimsCacheKey)) ?? {}

        const user = request.user
        if (user?.githubId) {
          if (
            storedClaims[wikidataId] &&
            storedClaims[wikidataId] !== user.githubId &&
            !steal
          ) {
            reply.status(401).send({ error: 'Not claim owner' })
          } else {
            storedClaims[wikidataId] = user.githubId
            await redisCache.set(
              validationClaimsCacheKey,
              JSON.stringify(storedClaims)
            )

            return reply.send({ ok: true })
          }
        } else {
          reply.status(401).send({ error: 'Unauthorized' })
        }
      } catch (error) {
        console.error('Get validation claims error:', error)
        return reply
          .status(500)
          .send({ error: 'Failed to fetch validation claims' })
      }
    }
  )

  app.delete(
    '/claim/:wikidataId',
    {
      schema: {
        summary: 'Delete a claim',
        description: 'Used to release a claim',
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

        const user = request.user
        if (user?.githubId) {
          if (storedClaims[wikidataId] === user?.githubId) {
            delete storedClaims[wikidataId]
            await redisCache.set(
              validationClaimsCacheKey,
              JSON.stringify(storedClaims)
            )
          } else {
            return reply.status(401).send({ error: 'Not the claim owner' })
          }
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
