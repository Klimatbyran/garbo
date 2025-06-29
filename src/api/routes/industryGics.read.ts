import { FastifyInstance } from 'fastify'
import fs from 'fs/promises'
import { join } from 'path'

export async function industryGicsRoute(app: FastifyInstance) {
  app.get('/', async (_request, reply) => {
    const filePath = join(process.cwd(), 'output/en/industry-gics.json')
    try {
      const data = await fs.readFile(filePath, 'utf-8')
      console.log('Industry GICS file path:', filePath)
      reply.send(JSON.parse(data))
    } catch (err) {
      console.error('Failed to load industry GICS data:', err)
      reply.status(500).send({
        error: 'Could not load industry GICS data',
        details: err.message,
      })
    }
  })
}
