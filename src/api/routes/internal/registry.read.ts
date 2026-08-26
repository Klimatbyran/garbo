import { FastifyInstance } from 'fastify'
import { getTags } from '../../../config/openapi'
import { RegistryList } from '../../schemas'
import { registryService } from '@/api/services/registryService'

export async function registryReadRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      schema: {
        summary: 'Get list of all reports in the registry',
        description:
          'Retrieve a list of all reports in the registry, including their company name, report year, and URL. This endpoint is intended to be used for retrieving the registry of reports that have been collected and saved in the database.',
        tags: getTags('Registry'),
        response: {
          200: RegistryList,
        },
      },
    },
    async (_request, reply) => {
      const registry = await registryService.getReportRegistry()
      reply.header('Cache-Control', 'no-store')
      reply.send(registry)
    }
  )
}
