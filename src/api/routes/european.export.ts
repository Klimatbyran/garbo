import { FastifyInstance, FastifyRequest } from 'fastify'

import { getTags } from '../../config/openapi'
import { exportQuery } from '../types'
import { exportService } from '../services/exportService'
import { exportQuerySchema } from '../schemas/request'

export async function europeanExportRoutes(app: FastifyInstance) {
  app.get(
    '/export',
    {
      schema: {
        summary: 'Export all European countries',
        description:
          'Export a list of all European countries with their historical emissions data broken down by sectors and subsectors over time.',
        tags: getTags('Europeans'),
        querystring: exportQuerySchema,
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: exportQuery
      }>,
      reply,
    ) => {
      const { content, name } = await exportService.exportEuropeans(
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
