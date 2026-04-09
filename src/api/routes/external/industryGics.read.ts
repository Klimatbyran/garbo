import { getTags } from '@/config/openapi'
import { FastifyInstance } from 'fastify'
import fs from 'fs/promises'
import { join } from 'path'

export async function industryGicsRoute(app: FastifyInstance) {
  app.get(
    '/',
    {
      schema: {
        summary: 'Get industry GICS data',
        description: 'Retrieve the industry GICS mapping used by the API.',
        tags: getTags('Internal'),
      },
    },
    async (_request, reply) => {
      const filePath = join(process.cwd(), 'output/en/industry-gics.json')
      try {
        const data = await fs.readFile(filePath, 'utf-8')
        console.log('Industry GICS file path:', filePath)
        reply.send(JSON.parse(data))
      } catch (err) {
        console.error('Failed to load industry GICS data:', err)
        const details = err instanceof Error ? err.message : String(err)
        reply.status(500).send({
          error: 'Could not load industry GICS data',
          details,
        })
      }
    }
  )
}
