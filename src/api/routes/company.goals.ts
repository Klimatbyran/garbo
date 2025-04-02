import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'

import { goalService } from '../services/goalService'
import {
  wikidataIdParamSchema,
  postGoalSchema,
  postGoalsSchema,
  okResponseSchema,
  garboEntityIdSchema,
  getErrorSchemas,
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
          ...getErrorSchemas(400, 404, 500),
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
      const { goals, metadata } = request.body;

      if (goals?.length) {
        const { wikidataId } = request.params;
        const user = request.user;

        try {
          await goalService.createGoals(wikidataId, goals, () =>
            metadataService.createMetadata({
              metadata,
              user,
            })
          );
        } catch(error) {
          console.error('ERROR Creation of goals failed:', error);
          return reply.status(500).send({message: 'Creation of goals failed.'})
        }
        
      }
      return reply.send({ ok: true });
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
          ...getErrorSchemas(400, 404, 500),
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
      const { id } = request.params;
      const { goal } = request.body;
      let createdMetadata;

      try {
        createdMetadata = await metadataService.createMetadata({
          metadata: request.body.metadata,
          user: request.user,
        });
      } catch(error) {
        console.error('ERROR Creation of metadata for update of goal failed:', error);
        return reply.status(500).send({message: 'Update of goal failed'});
      }

      try {
        await goalService.updateGoal(id, { goal }, createdMetadata)
      } catch(error) {
        console.error('ERROR Update of goal failed:', error);
        return reply.status(500).send({message: 'Update of goal failed.'})
      }
      
      return reply.send({ ok: true });
    }
  )
}
