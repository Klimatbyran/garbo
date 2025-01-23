import { AuthenticatedFastifyRequest, FastifyInstance } from 'fastify'

import { companyService } from '../services/companyService'
import { goalService } from '../services/goalService'
import { industryService } from '../services/industryService'
import { initiativeService } from '../services/initiativeService'
import { reportingPeriodService } from '../services/reportingPeriodService'
import { emissionsService } from '../services/emissionsService'
import {
  wikidataIdParamSchema,
  emptyBodySchema,
  garboEntityIdSchema,
  getErrorSchemas,
} from '../schemas'
import { getTags } from '../../config/openapi'
import { GarboEntityId, WikidataIdParams } from '../types'
import { eTagCache } from '../..'

export async function companyDeleteRoutes(app: FastifyInstance) {
  app.delete(
    '/:wikidataId',
    {
      schema: {
        summary: 'Delete company',
        description: 'Delete a company by Wikidata ID',
        tags: getTags('Companies'),
        params: wikidataIdParamSchema,
        response: {
          204: emptyBodySchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: WikidataIdParams }>,
      reply
    ) => {
      const { wikidataId } = request.params
      eTagCache.clear()
      await companyService.deleteCompany(wikidataId)
      reply.status(204).send()
    }
  )

  app.delete(
    '/goals/:id',
    {
      schema: {
        summary: 'Delete a goal',
        description: 'Delete a goal by id',
        tags: getTags('Goals'),
        params: garboEntityIdSchema,
        response: {
          204: emptyBodySchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params
      eTagCache.clear()
      await goalService.deleteGoal(id)
      reply.status(204).send()
    }
  )

  app.delete(
    '/:wikidataId/industry',
    {
      schema: {
        summary: 'Delete industry',
        description: 'Delete a company industry',
        tags: getTags('Industry'),
        params: garboEntityIdSchema,
        response: {
          204: emptyBodySchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: WikidataIdParams }>,
      reply
    ) => {
      const { wikidataId } = request.params
      eTagCache.clear()
      await industryService.deleteIndustry(wikidataId)
      reply.status(204).send()
    }
  )

  app.delete(
    '/initiatives/:id',
    {
      schema: {
        summary: 'Delete an initiative',
        description: 'Delete an initiative by id',
        tags: getTags('Initiatives'),
        params: garboEntityIdSchema,
        response: {
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      req: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = req.params
      eTagCache.clear()
      await initiativeService.deleteInitiative(id)
      reply.code(204).send()
    }
  )

  app.delete(
    '/reporting-period/:id',
    {
      schema: {
        summary: 'Delete a reporting period',
        description: 'Delete a reporting period by id',
        tags: getTags('ReportingPeriods'),
        params: garboEntityIdSchema,
        response: {
          204: emptyBodySchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params
      eTagCache.clear()
      await reportingPeriodService.deleteReportingPeriod(id)
      reply.code(204).send()
    }
  )

  app.delete(
    '/stated-total-emissions/:id',
    {
      schema: {
        summary: 'Delete stated total emissions',
        description: 'Delete stated total emissions by id',
        tags: getTags('Emissions'),
        params: garboEntityIdSchema,
        response: {
          204: emptyBodySchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params
      eTagCache.clear()
      await emissionsService.deleteStatedTotalEmissions(id)
      reply.code(204).send()
    }
  )

  app.delete(
    '/biogenic-emissions/:id',
    {
      schema: {
        summary: 'Delete biogenic emissions',
        description: 'Delete biogenic emissions by id',
        tags: getTags('Emissions'),
        params: garboEntityIdSchema,
        response: {
          204: emptyBodySchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params
      eTagCache.clear()
      await emissionsService.deleteBiogenicEmissions(id)
      reply.code(204).send()
    }
  )

  app.delete(
    '/scope1/:id',
    {
      schema: {
        summary: 'Delete Scope1',
        description: 'Delete the Scope1 emissions by id',
        tags: getTags('Emissions'),
        params: garboEntityIdSchema,
        response: {
          204: emptyBodySchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params
      eTagCache.clear()
      await emissionsService.deleteScope1(id)
      reply.code(204).send()
    }
  )

  app.delete(
    '/scope1and2/:id',
    {
      schema: {
        summary: 'Delete scope1and2',
        description: 'Delete a scope1and2 by id',
        tags: getTags('Emissions'),
        params: garboEntityIdSchema,
        response: {
          204: emptyBodySchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params
      eTagCache.clear()
      await emissionsService.deleteScope1And2(id)
      reply.code(204).send()
    }
  )

  app.delete(
    '/scope2/:id',
    {
      schema: {
        summary: 'Delete scope2',
        description: 'Delete a scope2 by id',
        tags: getTags('Emissions'),
        params: garboEntityIdSchema,
        response: {
          204: emptyBodySchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params
      eTagCache.clear()
      await emissionsService.deleteScope2(id)
      reply.code(204).send()
    }
  )

  app.delete(
    '/scope3/:id',
    {
      schema: {
        summary: 'Delete scope3',
        description: 'Delete a scope3 by id',
        tags: getTags('Emissions'),
        params: garboEntityIdSchema,
        response: {
          204: emptyBodySchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params
      eTagCache.clear()
      await emissionsService.deleteScope3(id)
      reply.code(204).send()
    }
  )

  app.delete(
    '/scope3-category/:id',
    {
      schema: {
        summary: 'Delete a scope3 category',
        description: 'Delete a scope3 category by id',
        tags: getTags('Emissions'),
        params: garboEntityIdSchema,
        response: {
          204: emptyBodySchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params
      eTagCache.clear()
      await emissionsService.deleteScope3Category(id)
      reply.code(204).send()
    }
  )
}
