import { FastifyInstance } from 'fastify'
import { getTags } from '../../../config/openapi'
import { cachePlugin } from '../../plugins/cache'
import {
  errorResponseSchema,
  ReportsCompanyList,
  previewQuerySchema,
} from '../../schemas'
import { reportsService } from '@/api/services/reportsService'
import { previewResponseSchema } from '../../schemas'

export async function reportsReadRoutes(app: FastifyInstance) {
  app.register(cachePlugin)

  app.get(
    '/list',
    {
      schema: {
        summary: 'Get list of all companies in the database',
        description:
          'Retrieve a list of all companies in the database, including their names and Wikidata IDs and reporting periods.',
        tags: getTags('Reports'),
        response: {
          200: ReportsCompanyList,
        },
      },
    },
    async (request, reply) => {
      const companies = await reportsService.getAllCompanies()
      reply.send(companies || [])
    }
  )

  app.get(
    '/preview',
    {
      schema: {
        summary: 'Generate preview image from PDF URL',
        description:
          'Returns a preview image (JPEG) from the first page of the given PDF URL.',
        tags: getTags('Reports'),
        querystring: previewQuerySchema,
        response: {
          200: previewResponseSchema,
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { pdfUrl } = request.query as { pdfUrl: string }
      const jpegBuffer = await reportsService.generateReportPreview(pdfUrl)
      if (!jpegBuffer) {
        reply.status(400).send({ message: 'Failed to generate preview.' })
        return
      }

      reply.header('Content-Type', 'image/jpeg')
      return reply.send(jpegBuffer)
    }
  )
}
