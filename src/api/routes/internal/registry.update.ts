import { FastifyInstance } from 'fastify'
import { Prisma } from '@prisma/client'
import { getTags } from '../../../config/openapi'
import {
  registryUpdateRequestBodySchema,
  registryUpdateResponseSchema,
  getErrorSchemas,
} from '../../schemas'
import { registryService } from '@/api/services/registryService'
import { reportTypeService } from '@/api/services/reportTypeService'
import { redisCache } from '@/lib/redisCacheSingleton'
import { invalidateRegistryCache } from '@/api/services/registryCache'
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
          ...getErrorSchemas(404, 409),
        },
      },
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<
          typeof registryUpdateRequestBodySchema
        >
        await reportTypeService.assertValidReportTypeId(body.reportTypeId)

        const updatedReport = await registryService.updateReportInRegistry(body)

        if (!updatedReport) {
          return reply.status(404).send({ message: 'Report not found' })
        }

        await invalidateRegistryCache(redisCache, request.log)

        reply.send(updatedReport)
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          return reply.status(409).send({
            message:
              'A report with this URL, source URL, S3 URL, or hash already exists.',
          })
        }
        throw error
      }
    }
  )
}
