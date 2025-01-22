import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'

import { goalService } from '../services/goalService'
import {
  wikidataIdParamSchema,
  postGoalSchema,
  postGoalsSchema,
  okResponseSchema,
  garboEntityIdSchema,
  errorSchema,
} from '../schemas'
import {
  PostGoalsBody,
  PostGoalBody,
  GarboEntityId,
  WikidataIdParams,
} from '../types'
import { metadataService } from '../services/metadataService'
import { getTags } from '../../config/openapi'

export async function companyGoalsRoutes(app: FastifyInstance) {
  app.post(
    '/:wikidataId/goals',
    {
      schema: {
        summary: 'Create company goals',
        description: 'Create new goals for a company',
        tags: getTags('Goals'),
        params: wikidataIdParamSchema,
        body: postGoalsSchema,
        response: {
          200: okResponseSchema,
          404: errorSchema,
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: WikidataIdParams
        Body: PostGoalsBody
      }>,
      reply
    ) => {
      const { goals, metadata } = request.body

      if (goals?.length) {
        const { wikidataId } = request.params
        const user = request.user

        await goalService.createGoals(wikidataId, goals, () =>
          metadataService.createMetadata({
            metadata,
            user,
          })
        )
      }
      reply.send({ ok: true })
    }
  )

  app.patch(
    '/:wikidataId/goals/:id',
    {
      schema: {
        summary: 'Update company goal',
        description: 'Update a goal for a company',
        tags: getTags('Goals'),
        params: garboEntityIdSchema,
        body: postGoalSchema,
        response: {
          200: okResponseSchema,
          404: errorSchema,
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: GarboEntityId
        Body: PostGoalBody
      }>,
      reply
    ) => {
      const { id } = request.params
      const { goal } = request.body

      const createdMetadata = await metadataService.createMetadata({
        metadata: request.body.metadata,
        user: request.user,
      })

      await goalService.updateGoal(id, { goal }, createdMetadata)

      reply.send({ ok: true })
    }
  )
}
