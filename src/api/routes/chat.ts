import { FastifyInstance, FastifyRequest } from 'fastify'

import { cachePlugin } from '../plugins/cache'
import { ChatMessageSchema, getErrorSchemas } from '../schemas'
import { getTags } from '../../config/openapi'
import { PostChatMessageBody } from '../types'
import { vectorDB } from '../../lib/vectordb'
import { askPrompt } from '../../lib/openai'

export async function chatRoutes(app: FastifyInstance) {
  app.register(cachePlugin)

  app.post(
    '/',
    {
      schema: {
        summary: 'Get AI chat message',
        description:
          'Retrieve a chat message from the AI chatbot based on the latest chats and RAG data',
        tags: getTags('Chat'),
        response: {
          200: ChatMessageSchema,
          ...getErrorSchemas(400),
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: PostChatMessageBody
      }>,
      reply
    ) => {
      const { url, message } = request.body

      const ragData = await vectorDB.getRelevantMarkdown(
        url,
        [
          message,
          'GHG accounting, tCO2e (location-based method), ton CO2e, scope, scope 1, scope 2, scope 3, co2, emissions, emissions, 2021, 2023, 2022, gri protocol, CO2, ghg, greenhouse, gas, climate, change, global, warming, carbon, växthusgaser, utsläpp, basår, koldioxidutsläpp, koldioxid, klimatmål',
        ],
        5
      )

      console.log('ragData', ragData)

      const response = await askPrompt(message, ragData)

      reply.send({ message: response })
    }
  )
}
