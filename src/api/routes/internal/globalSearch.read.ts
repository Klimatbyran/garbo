import { FastifyInstance } from 'fastify'
import { getTags } from '../../../config/openapi'
import { cachePlugin } from '../../plugins/cache'
import { globalSearchResponseSchema } from '@/api/schemas'
import { globalSearchRequestSchema } from '@/api/schemas'
import { getErrorSchemas } from '@/api/schemas'
import { globalSearchService } from '@/api/services/globalSearchService'
import { GlobalSearchRequest } from '@/api/types'

export async function globalSearchReadRoutes(app: FastifyInstance) {
  app.register(cachePlugin)

  app.post(
    '/',
    {
      schema: {
        summary:
          'Search for municipality, company, or region in relations to global search',
        description:
          'Search for municipality, company, or region in relations to global search. This endpoint is used for the global search functionality in the frontend, allowing users to quickly find relevant information across different entities.',
        tags: getTags('Search'),
        body: globalSearchRequestSchema,
        response: {
          200: globalSearchResponseSchema,
          ...getErrorSchemas(400, 500),
        },
      },
    },
    async (request, reply) => {
      const { name } = request.body as GlobalSearchRequest
      const result = await globalSearchService.getGlobalSearchResults(name)

      reply.send(result)
    }
  )
}
