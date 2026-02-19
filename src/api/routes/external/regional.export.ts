import { FastifyInstance, FastifyRequest } from 'fastify'

import { getTags } from '../../../config/openapi'
import { exportQuery } from '../../types'
import { exportService } from '../../services/exportService'
import { exportQuerySchema } from '../../schemas/request'

export async function regionalExportRoutes(app: FastifyInstance) {
  app.get(
    '/export',
    {
      schema: {
        summary: 'Export all regions',
        description:
          'Export a list of all regions with their historical emissions data broken down by sectors and subsectors over time.',
        tags: getTags('Regions'),
        querystring: exportQuerySchema,
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: exportQuery
      }>,
      reply,
    ) => {
      const { content, name } = await exportService.exportRegions(
        request.query.type,
      )
      try {
        reply.header('Content-Type', 'application/octet-stream') // Generic binary data
        reply.header('Content-Disposition', `attachment; filename="${name}"`)

        return reply.send(content)
      } catch (err) {
        console.log(err)
      }
    },
  )
}
