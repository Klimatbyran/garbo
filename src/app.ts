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
import { companyReadRoutes } from './api/routes/external/company.read'
import { companyGoalsRoutes } from './api/routes/internal/company.goals'
import authPlugin from './api/plugins/auth'
import { companyIndustryRoutes } from './api/routes/internal/company.industry'
import { companyInitiativesRoutes } from './api/routes/internal/company.initiatives'
import {
  companyPublicReportingPeriodsRoutes,
  companyReportingPeriodsRoutes,
} from './api/routes/internal/company.reportingPeriods'
import { companyUpdateRoutes } from './api/routes/internal/company.update'
import { companyDeleteRoutes } from './api/routes/internal/company.delete'
import { errorHandler } from './api/plugins/errorhandler'
import { reportsCreateRoutes } from './api/routes/reports.create'
import { municipalityReadRoutes } from './api/routes/external/municipality.read'
import { regionalReadRoutes } from './api/routes/external/regional.read'
import { nationalReadRoutes } from './api/routes/external/national.read'
import { companyBaseYearRoutes } from './api/routes/internal/company.baseYear'
import { authentificationRoutes } from './api/routes/internal/auth'
import { companyExportRoutes } from './api/routes/external/company.export'
import { municipalityExportRoutes } from './api/routes/external/municipality.export'
import { regionalExportRoutes } from './api/routes/external/regional.export'
import { mailingListDownloadsRoute } from './api/routes/internal/mailing-list.downloads'
import { validationsReadRoutes } from './api/routes/external/validation.read'
import { validationsUpdateRoutes } from './api/routes/internal/validation.update'
import { emissionsAssessmentRoutes } from './api/routes/internal/emissionsAssessment'
import { industryGicsRoute } from './api/routes/external/industryGics.read'
import { screenshotsReadRoutes } from './api/routes/external/screenshots.read'
import { newsletterArchiveDownloadsRoute } from './api/routes/external/newsletter-archive.downloads'
import { internalCompanyReadRoutes } from './api/routes/internal/internal.company.read'
import { internalMunicipalityReadRoutes } from './api/routes/internal/internal.municipality.read'

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

  //internal routes for data assessment and management
  app.register(internalCompanyReadRoutes, { prefix: 'api/internal-companies' })
  app.register(internalMunicipalityReadRoutes, {
    prefix: 'api/internal-municipalities',
  })

  //public routes
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
  app.register(reportsCreateRoutes, { prefix: 'api/reports' })
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
}

export default startApp
