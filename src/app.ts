import Fastify, { type FastifyInstance } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'

import apiConfig from './config/api'
// import { sessionPlugin, authenticationRequiredPlugin } from './lib/auth'

async function startApp() {
  const app = Fastify({
    logger: apiConfig.logger,
  }).withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  // app.register(sessionPlugin)

  app.register(publicContext)
  app.register(authenticatedContext)

  return app
}

/**
 * This context wraps all logic that should be public.
 */
async function publicContext(app: FastifyInstance) {
  app.get('/health-check', async () => ({ ok: true }))
}

/**
 * This context wraps all logic that requires authentication.
 */
async function authenticatedContext(app: FastifyInstance) {
  // app.register(authenticationRequiredPlugin)
  // TODO: POST and delete routes
}

export default startApp
