import { FastifyInstance, FastifyRequest } from 'fastify'

import { getTags } from '../../../config/openapi'
import { exportQuery } from '../../types'
import { exportService } from '../../services/exportService'
import { exportQuerySchema } from '../../schemas/request'

export async function municipalityExportRoutes(app: FastifyInstance) {
  app.get(
    '/export',
    {
      schema: {
        summary: 'Export all municipalities',
        description:
          'Export a list of all municipalities with data about their emissions, carbon budget, climate plans, bike infrastructure, procurements, and much more.',
        tags: getTags('Municipalities'),
        querystring: exportQuerySchema,
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: exportQuery
      }>,
      reply,
    ) => {
      const { content, name } = await exportService.exportMunicipalities(
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
