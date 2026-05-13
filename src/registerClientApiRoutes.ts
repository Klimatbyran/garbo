import { type FastifyInstance } from 'fastify'
import fastifyStatic from '@fastify/static'
import { resolve } from 'path'

import openAPIConfig from './config/openapi'
import { companyReadRoutes } from './api/routes/external/company.read'
import { municipalityReadRoutes } from './api/routes/external/municipality.read'
import { regionalReadRoutes } from './api/routes/external/regional.read'
import { nationalReadRoutes } from './api/routes/external/national.read'
import { authentificationRoutes } from './api/routes/internal/auth'
import { companyExportRoutes } from './api/routes/external/company.export'
import { municipalityExportRoutes } from './api/routes/external/municipality.export'
import { regionalExportRoutes } from './api/routes/external/regional.export'
import { mailingListDownloadsRoute } from './api/routes/internal/mailing-list.downloads'
import { screenshotsReadRoutes } from './api/routes/external/screenshots.read'
import { newsletterArchiveDownloadsRoute } from './api/routes/external/newsletter-archive.downloads'
import { internalCompanyReadRoutes } from './api/routes/internal/internal.company.read'
import { internalMunicipalityReadRoutes } from './api/routes/internal/internal.municipality.read'
import { companyPublicReportingPeriodsRoutes } from './api/routes/internal/company.reportingPeriods'
import { globalSearchReadRoutes } from './api/routes/internal/globalSearch.read'

/**
 * Routes that accept X-API-Key (first-party via validate/bolt proxy, partners, etc.).
 * HTTP paths are unchanged; naming reflects "client API" vs staff JWT routes.
 */
export async function registerClientApiRoutes(app: FastifyInstance) {
  app.get('/', { schema: { hide: true } }, (request, reply) =>
    reply.redirect(openAPIConfig.prefix)
  )

  app.register(fastifyStatic, {
    root: resolve('public'),
  })

  app.get(
    '/favicon.ico',
    { schema: { hide: true }, logLevel: 'silent' },
    async (request, reply) => {
      return reply.sendFile('favicon.ico')
    }
  )

  app.register(internalCompanyReadRoutes, { prefix: 'api/internal-companies' })
  app.register(internalMunicipalityReadRoutes, {
    prefix: 'api/internal-municipalities',
  })

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
  app.register(globalSearchReadRoutes, { prefix: 'api/global-search' })
}
