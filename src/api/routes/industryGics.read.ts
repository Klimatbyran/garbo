import { FastifyInstance } from 'fastify'
import fs from 'fs/promises'
import path from 'path'

export async function industryGicsRoute(app: FastifyInstance) {
  app.get('/', async (_request, reply) => {
    const filePath = path.join(__dirname, '../../output/en/industry-gics.json')
    try {
      const data = await fs.readFile(filePath, 'utf-8')
      reply.send(JSON.parse(data))
    } catch (err) {
      reply.status(500).send({ error: 'Could not load industry GICS data' })
    }
  })
}
