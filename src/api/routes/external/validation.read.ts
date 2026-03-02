import { FastifyInstance } from 'fastify'
import { redisCache } from '../../..'
import { getErrorSchemas, ValidationClaimsSchema } from '../../schemas'

export const validationClaimsCacheKey = 'validation:claims'

export async function validationsReadRoutes(app: FastifyInstance) {
  app.get(
    '/claim',
    {
      schema: {
        summary: 'Get all validation claims',
        description:
          'Get a list of all claimed companies for manual validation',
        tags: ['ReportValidations'],

        response: {
          200: ValidationClaimsSchema,
          ...getErrorSchemas(500),
        },
      },
    },
    async (_request, reply) => {
      try {
        const storedClaims: Record<string, string> = (await redisCache.get(
          validationClaimsCacheKey
        )) ?? { hello: 'bar' }

        return reply.send(storedClaims)
      } catch (error) {
        console.error('Get validation claims error:', error)
        return reply
          .status(500)
          .send({ error: 'Failed to fetch validation claims' })
      }
    }
  )
}
