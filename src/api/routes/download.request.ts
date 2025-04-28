import { FastifyInstance } from 'fastify'
import { subscribeAndTagUser } from '../services/mailchimp'

export async function downloadRequestRoute(app: FastifyInstance) {
  app.post('/api/download-request', async (request, reply) => {
    const { email, reason } = request.body as { email: string; reason: string }

    if (!email || !reason) {
      return reply.status(400).send({ error: 'Email and reason are required' })
    }

    try {
      await subscribeAndTagUser(email, reason)
      return reply.send({ success: true })
    } catch (error) {
      console.error('Subscribe error:', error)
      return reply.status(500).send({ error: 'Failed to subscribe user' })
    }
  })
}