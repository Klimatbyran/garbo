import { FastifyInstance } from 'fastify'
import { getTags } from '../../../config/openapi'
import { cachePlugin } from '../../plugins/cache'
import { RegistryList } from '../../schemas'
import { registryService } from '@/api/services/registryService'
import { redisCache } from '@/index'
import { prisma } from '@/lib/prisma'

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
      const cacheKey = 'registry:etag'
      let currentEtag: string = await redisCache.get(cacheKey)

      const [registryCount] = await prisma.$transaction([prisma.report.count()])

      // Create a unique fingerprint based on registry data
      const databaseFingerprint = [registryCount].join('|')

      if (!currentEtag || !currentEtag.startsWith(databaseFingerprint)) {
        currentEtag = `${databaseFingerprint}-${new Date().toISOString()}`
        await redisCache.set(cacheKey, JSON.stringify(currentEtag))
      }

      const dataCacheKey = `registry:data:${databaseFingerprint}`

      let registry = await redisCache.get(dataCacheKey)

      if (!registry) {
        registry = await registryService.getReportRegistry()
        await redisCache.set(dataCacheKey, JSON.stringify(registry))
      }

      reply.header('ETag', currentEtag)
      reply.send(registry)
    }
  )
}
