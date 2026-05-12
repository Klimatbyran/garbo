import { FastifyInstance } from 'fastify'
import { getTags } from '../../../config/openapi'
import {
  getErrorSchemas,
  registryDeleteResponseSchema,
  registryDeleteRequestBodySchema,
} from '../../schemas'
import { registryService } from '@/api/services/registryService'
import { redisCache } from '@/lib/redisCacheSingleton'
import { invalidateRegistryCache } from '@/api/services/registryCache'
import z from 'zod'

export async function registryDeleteRoutes(app: FastifyInstance) {
  app.delete(
    '/',
    {
      schema: {
        summary: 'Delete chosen report from the registry',
        description:
          'Delete one or more reports from the registry by their id.',
        tags: getTags('Registry'),
        body: registryDeleteRequestBodySchema,
        response: {
          200: registryDeleteResponseSchema,
          ...getErrorSchemas(500),
        },
      },
    },
    async (request, reply) => {
      try {
        const deletedReports = await registryService.deleteReportFromRegistry(
          request.body as z.infer<typeof registryDeleteRequestBodySchema>
        )

        if (deletedReports.length > 0) {
          await invalidateRegistryCache(redisCache, request.log)
        }

        const success = deletedReports.length > 0
        reply.send({
          message: success
            ? `Successfully deleted ${deletedReports.length} report(s)`
            : 'No matching reports found to delete',
          deletedReports,
        })
      } catch (error) {
        request.log.error(error, 'Failed to delete report(s) from registry')
        return reply.status(500).send({ message: 'Failed to delete report(s)' })
      }
    }
  )
}
