import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
  jsonSchemaTransform,
} from 'fastify-type-provider-zod'
import fastifySwagger from '@fastify/swagger'
import { fastifyCookie } from '@fastify/cookie'

import scalarPlugin from '@scalar/fastify-api-reference'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import apiConfig from './config/api'
import openAPIConfig from './config/openapi'
import { companyGoalsRoutes } from './api/routes/internal/company.goals'
import authPlugin from './api/plugins/auth'
import { companyIndustryRoutes } from './api/routes/internal/company.industry'
import { companyInitiativesRoutes } from './api/routes/internal/company.initiatives'
import {
  companyReportingPeriodsRoutes,
} from './api/routes/internal/company.reportingPeriods'
import { companyUpdateRoutes } from './api/routes/internal/company.update'
import { companyDeleteRoutes } from './api/routes/internal/company.delete'
import { errorHandler } from './api/plugins/errorhandler'
import { clientApiKeysAdminRoutes } from './api/routes/internal/clientApiKeys.admin'
import { reportsCreateRoutes } from './api/routes/internal/reports.create'
import { companyBaseYearRoutes } from './api/routes/internal/company.baseYear'
import { validationsReadRoutes } from './api/routes/external/validation.read'
import { validationsUpdateRoutes } from './api/routes/internal/validation.update'
import { emissionsAssessmentRoutes } from './api/routes/internal/emissionsAssessment'
import { industryGicsRoute } from './api/routes/external/industryGics.read'
import { tagOptionsRoutes } from './api/routes/tagOptions'
import { registryReadRoutes } from './api/routes/internal/registry.read'
import { registryDeleteRoutes } from './api/routes/internal/registry.delete'
import { registryUpdateRoutes } from './api/routes/internal/registry.update'
import { globalSearchReadRoutes } from './api/routes/internal/globalSearch.read'
import { queueArchiveReadRoutes } from './api/routes/internal/queue.archive.read'
import clientApiKeyGatePlugin from './api/plugins/clientApiKeyGate'
import { registerClientApiRoutes } from './registerClientApiRoutes'

async function startApp() {
  const app = Fastify({
    logger: apiConfig.logger,
  }).withTypeProvider<ZodTypeProvider>()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  app.setErrorHandler(errorHandler)
  app.register(cors, {
    origin: apiConfig.corsAllowOrigins as unknown as string[],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    exposedHeaders: ['etag'],
  })

  app.register(fastifySwagger, {
    prefix: openAPIConfig.prefix,
    openapi: {
      openapi: '3.1.1',
      info: {
        title: openAPIConfig.title,
        description: openAPIConfig.description,
        version: JSON.parse(readFileSync(resolve('package.json'), 'utf-8'))
          .version,
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
          },
          ClientApiKey: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description:
              'Client API key (format garb_<lookup>.<secret>). Used for browser/proxy and partner access to read routes; staff flows use Bearer JWT.',
          },
        },
      },
      servers: [
        {
          url: '/api',
          description: 'API endpoint',
        },
      ],
      tags: Object.values(openAPIConfig.tags),
    },
    transform: jsonSchemaTransform,
  })

  app.register(scalarPlugin, {
    routePrefix: `/${openAPIConfig.prefix}`,
    logLevel: 'silent',
    configuration: {
      metaData: {
        title: openAPIConfig.title,
      },
    },
  })

  app.register(fastifyCookie)

  await app.register(clientApiKeyGatePlugin)
  app.register(clientApiContext)
  app.register(authenticatedContext)

  return app
}

/**
 * Client API surface: X-API-Key gated read routes (unless ALLOW_ANONYMOUS_CLIENT_API).
 */
async function clientApiContext(app: FastifyInstance) {
  await app.register(registerClientApiRoutes)
}

/**
 * This context wraps all logic that requires authentication.
 */
async function authenticatedContext(app: FastifyInstance) {
  app.register(authPlugin)
  app.register(companyUpdateRoutes, { prefix: 'api/companies' })
  app.register(companyIndustryRoutes, { prefix: 'api/companies' })
  app.register(companyReportingPeriodsRoutes, { prefix: 'api/companies' })
  app.register(companyGoalsRoutes, { prefix: 'api/companies' })
  app.register(companyBaseYearRoutes, { prefix: 'api/companies' })
  app.register(companyInitiativesRoutes, { prefix: 'api/companies' })

  app.register(companyDeleteRoutes, { prefix: 'api/companies' })
  app.register(validationsReadRoutes, { prefix: 'api/validation' })
  app.register(validationsUpdateRoutes, { prefix: 'api/validation' })

  app.register(emissionsAssessmentRoutes, {
    prefix: 'api/emissions-assessment',
  })
  app.register(industryGicsRoute, { prefix: 'api/industry-gics' })
  app.register(tagOptionsRoutes, { prefix: 'api/tag-options' })
  app.register(registryReadRoutes, { prefix: 'api/reports/registry' })
  app.register(registryDeleteRoutes, { prefix: 'api/reports/registry' })
  app.register(registryUpdateRoutes, { prefix: 'api/reports/registry' })
  app.register(reportsCreateRoutes, {
    prefix: 'api/internal-companies/reports',
  })
  app.register(queueArchiveReadRoutes, {
    prefix: 'api/queue-archive',
  })
  app.register(clientApiKeysAdminRoutes, {
    prefix: 'api/internal/client-api-keys',
  })
}

export default startApp
