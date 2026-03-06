import { FastifyInstance } from 'fastify'
import { getTags } from '../../../config/openapi'
import { cachePlugin } from '../../plugins/cache'
import { ReportsCompanyList } from '../../schemas'
import { reportsService } from '@/api/services/reportsService'

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
}
