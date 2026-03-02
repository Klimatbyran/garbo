import { FastifyInstance, FastifyRequest } from 'fastify'
import { getTags } from '../../../config/openapi'
import { exportQuerySchema } from '../../schemas'
import { exportService } from '../../services/exportService'
import { exportQuery } from '../../types'

export async function companyExportRoutes(app: FastifyInstance) {
  app.get(
    '/export',
    {
      schema: {
        summary: 'Export companies',
        description: 'Export the company data in form of various file formats',
        tags: getTags('Companies'),
        querystring: exportQuerySchema,
        response: {},
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: exportQuery
      }>,
      reply
    ) => {
      let year: number | undefined = undefined

      if (request.query.year) year = parseInt(request.query.year)

      const { content, name } = await exportService.exportCompanies(
        request.query.type,
        year
      )
      try {
        reply.header('Content-Type', 'application/octet-stream') // Generic binary data
        reply.header('Content-Disposition', `attachment; filename="${name}"`)

        // Send the file content
        return reply.send(content)
      } catch (err) {
        console.log(err)
      }
    }
  )
}
