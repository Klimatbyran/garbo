import { FastifyInstance } from 'fastify'
import { getTags } from '../../../config/openapi'
import { cachePlugin } from '../../plugins/cache'
import { RegistryList } from '../../schemas'
import { registryService } from '@/api/services/registryService'
import { redisCache } from '@/lib/redisCacheSingleton'
import {
  REGISTRY_DATA_KEY,
  REGISTRY_ETAG_KEY,
} from '@/api/services/registryCache'

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
      let [registry, etag] = await Promise.all([
        redisCache.get(REGISTRY_DATA_KEY),
        redisCache.get(REGISTRY_ETAG_KEY),
      ])

      if (!registry || !etag) {
        registry = await registryService.getReportRegistry()
        etag = new Date().toISOString()
        await Promise.all([
          redisCache.set(REGISTRY_DATA_KEY, JSON.stringify(registry)),
          redisCache.set(REGISTRY_ETAG_KEY, JSON.stringify(etag)),
        ])
      }

      reply.header('ETag', `"${etag}"`)
      reply.send(registry)
    }
  )
}
