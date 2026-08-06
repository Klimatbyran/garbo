import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'

import { goalService } from '../../services/goalService'
import { companyService } from '../../services/companyService'
import {
  companyIdParamSchema,
  companyGoalParamsSchema,
  postGoalSchema,
  postGoalsSchema,
  okResponseSchema,
  getErrorSchemas,
} from '../../schemas'
import {
  PostGoalsBody,
  PostGoalBody,
  CompanyIdParams,
  CompanyGoalParams,
} from '../../types'
import { metadataService } from '../../services/metadataService'
import { getTags } from '../../../config/openapi'

export async function companyGoalsRoutes(app: FastifyInstance) {
  app.post(
    '/:id/goals',
    {
      schema: {
        summary: 'Create company goals',
        description: 'Create new goals for a company',
        tags: getTags('Goals'),
        params: companyIdParamSchema,
        body: postGoalsSchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: CompanyIdParams
        Body: PostGoalsBody
      }>,
      reply
    ) => {
      const { goals, metadata } = request.body

      if (goals?.length) {
        const { id } = request.params
        const user = request.user

        try {
          const company = await companyService.getCompanyByInternalId(id)
          await goalService.createGoals(company.id, goals, () =>
            metadataService.createMetadata({
              metadata,
              user,
            })
          )
        } catch (error) {
          console.error('ERROR Creation of goals failed:', error)
          return reply
            .status(500)
            .send({ message: 'Creation of goals failed.' })
        }
      }
      return reply.send({ ok: true })
    }
  )

  app.patch(
    '/:id/goals/:goalId',
    {
      schema: {
        summary: 'Update company goal',
        description: 'Update a goal for a company',
        tags: getTags('Goals'),
        params: companyGoalParamsSchema,
        body: postGoalSchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: CompanyGoalParams
        Body: PostGoalBody
      }>,
      reply
    ) => {
      const { goalId } = request.params
      const { goal } = request.body
      let createdMetadata

      try {
        createdMetadata = await metadataService.createMetadata({
          metadata: request.body.metadata,
          user: request.user,
        })
      } catch (error) {
        console.error(
          'ERROR Creation of metadata for update of goal failed:',
          error
        )
        return reply.status(500).send({ message: 'Update of goal failed' })
      }

      try {
        await goalService.updateGoal(goalId, { goal }, createdMetadata)
      } catch (error) {
        console.error('ERROR Update of goal failed:', error)
        return reply.status(500).send({ message: 'Update of goal failed.' })
      }

      return reply.send({ ok: true })
    }
  )
}
