import { FastifyInstance } from 'fastify'
import { getTags } from '../../../config/openapi'
import { cachePlugin } from '../../plugins/cache'
import { RegistryList } from '../../schemas'
import { registryService } from '@/api/services/registryServices'

export async function registryReadRoutes(app: FastifyInstance) {
  app.register(cachePlugin)

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
    async (request, reply) => {
      const registry = await registryService.getReportRegistry()
      reply.send(registry)
    }
  )
}
