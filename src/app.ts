import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
  jsonSchemaTransform,
} from 'fastify-type-provider-zod'
import fastifySwagger from '@fastify/swagger'
import fastifyStatic from '@fastify/static'
import { fastifySession } from '@fastify/session'
import { fastifyCookie } from '@fastify/cookie'

import scalarPlugin from '@scalar/fastify-api-reference'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import apiConfig from './config/api'
import openAPIConfig from './config/openapi'
import { companyReadRoutes } from './api/routes/company.read'
import { companyGoalsRoutes } from './api/routes/company.goals'
import authPlugin from './api/plugins/auth'
import { companyIndustryRoutes } from './api/routes/company.industry'
import { companyInitiativesRoutes } from './api/routes/company.initiatives'
import {
  companyPublicReportingPeriodsRoutes,
  companyReportingPeriodsRoutes,
} from './api/routes/company.reportingPeriods'
import { companyUpdateRoutes } from './api/routes/company.update'
import { companyDeleteRoutes } from './api/routes/company.delete'
import { errorHandler } from './api/plugins/errorhandler'
import { municipalityReadRoutes } from './api/routes/municipality.read'
import { regionalReadRoutes } from './api/routes/regional.read'
import { nationalReadRoutes } from './api/routes/national.read'
import { companyBaseYearRoutes } from './api/routes/company.baseYear'
import { authentificationRoutes } from './api/routes/auth'
import { companyExportRoutes } from './api/routes/company.export'
import { municipalityExportRoutes } from './api/routes/municipality.export'
import { regionalExportRoutes } from './api/routes/regional.export'
import { mailingListDownloadsRoute } from './api/routes/mailing-list.downloads'
import { validationsReadRoutes } from './api/routes/validation.read'
import { validationsUpdateRoutes } from './api/routes/validation.update'
import { emissionsAssessmentRoutes } from './api/routes/emissionsAssessment'
import { industryGicsRoute } from './api/routes/industryGics.read'
import { tagOptionsRoutes } from './api/routes/tagOptions'
import { screenshotsReadRoutes } from './api/routes/screenshots.read'
import { newsletterArchiveDownloadsRoute } from './api/routes/newsletter-archive.downloads'

async function startApp() {
  const app = Fastify({
    logger: apiConfig.logger,
  }).withTypeProvider<ZodTypeProvider>()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  app.setErrorHandler(errorHandler)
  app.register(cors, {
    origin: apiConfig.corsAllowOrigins as unknown as string[],
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

  app.register(publicContext)
  app.register(authenticatedContext)

  return app
}

/**
 * This context wraps all logic that should be public.
 */
async function publicContext(app: FastifyInstance) {
  app.get('/', { schema: { hide: true } }, (request, reply) =>
    reply.redirect(openAPIConfig.prefix),
  )

  app.register(fastifyStatic, {
    root: resolve('public'),
  })

  app.get(
    '/favicon.ico',
    { schema: { hide: true }, logLevel: 'silent' },
    async (request, reply) => {
      return reply.sendFile('favicon.ico')
    },
  )

  app.register(authentificationRoutes, { prefix: 'api/auth' })
  app.register(companyReadRoutes, { prefix: 'api/companies' })
  app.register(companyExportRoutes, { prefix: 'api/companies' })
  app.register(municipalityReadRoutes, { prefix: 'api/municipalities' })
  app.register(municipalityExportRoutes, { prefix: 'api/municipalities' })
  app.register(regionalReadRoutes, { prefix: 'api/regions' })
  app.register(regionalExportRoutes, { prefix: 'api/regions' })
  app.register(nationalReadRoutes, { prefix: 'api/nation' })
  app.register(companyPublicReportingPeriodsRoutes, {
    prefix: 'api/reporting-period',
  })
  app.register(mailingListDownloadsRoute, { prefix: 'api' })
  app.register(screenshotsReadRoutes, { prefix: 'api/screenshots' })

  app.register(newsletterArchiveDownloadsRoute, {
    prefix: 'api/newsletters',
  })
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
}

export default startApp
