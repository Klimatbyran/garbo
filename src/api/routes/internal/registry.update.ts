import { FastifyInstance } from 'fastify'
import { getTags } from '../../../config/openapi'
import {
  registryUpdateRequestBodySchema,
  registryUpdateResponseSchema,
  getErrorSchemas,
} from '../../schemas'
import { registryService } from '@/api/services/registryService'
import z from 'zod'

export async function registryUpdateRoutes(app: FastifyInstance) {
  app.patch(
    '/',
    {
      schema: {
        summary: 'Update a registry report',
        description:
          'Update the fields of a report in the registry by its id. Only provided fields will be updated.',
        tags: getTags('Registry'),
        body: registryUpdateRequestBodySchema,
        response: {
          200: registryUpdateResponseSchema,
          ...getErrorSchemas(404),
        },
      },
    },
    async (request, reply) => {
      const updatedReport = await registryService.updateReportInRegistry(
        request.body as z.infer<typeof registryUpdateRequestBodySchema>
      )

      if (!updatedReport) {
        return reply.status(404).send({ message: 'Report not found' })
      }

      reply.send(updatedReport)
    }
  )
}
