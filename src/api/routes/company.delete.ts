import { AuthenticatedFastifyRequest, FastifyInstance } from 'fastify'

import { companyService } from '../services/companyService'
import { processRequest } from '../middlewares/zod-middleware'
import { goalService } from '../services/goalService'
import { industryService } from '../services/industryService'
import { initiativeService } from '../services/initiativeService'
import { reportingPeriodService } from '../services/reportingPeriodService'
import { emissionsService } from '../services/emissionsService'
import {
  wikidataIdParamSchema,
  getErrorResponseSchemas,
  garboEntitySchema,
  emptyBodySchema,
} from '../schemas'
import { getTags } from '../../openapi/utils'
import { GarboEntityId, WikidataIdParams } from '../types'

export async function companyDeleteRoutes(app: FastifyInstance) {
  app.delete(
    '/:wikidataId',
    {
      schema: {
        summary: 'Delete company',
        description: 'Deletes a company by Wikidata ID',
        tags: getTags('Companies'),
        params: wikidataIdParamSchema,
        response: {
          204: emptyBodySchema,
          ...getErrorResponseSchemas(500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: WikidataIdParams }>,
      reply
    ) => {
      const { wikidataId } = request.params
      await companyService.deleteCompany(wikidataId)
      reply.status(204).send()
    }
  )

  app.delete(
    '/goals/:id',
    {
      schema: {
        summary: 'Delete a goal',
        description: 'Deletes a goal by id',
        tags: getTags('Goals'),
        params: garboEntitySchema,
        response: {
          204: emptyBodySchema,
          ...getErrorResponseSchemas(500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params
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
        params: garboEntitySchema,
        response: {
          204: emptyBodySchema,
          ...getErrorResponseSchemas(500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: WikidataIdParams }>,
      reply
    ) => {
      const { wikidataId } = request.params
      await industryService.deleteIndustry(wikidataId)
      reply.status(204).send()
    }
  )

  app.delete(
    '/initiatives/:id',
    {
      schema: {
        summary: 'Delete an initiative',
        description: 'Deletes an initiative by id',
        tags: getTags('Initiatives'),
        params: garboEntitySchema,
        response: {
          204: emptyBodySchema,
          ...getErrorResponseSchemas(500),
        },
      },
    },
    async (
      req: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = req.params
      await initiativeService.deleteInitiative(id)
      reply.code(204).send()
    }
  )

  app.delete(
    '/reporting-period/:id',
    {
      schema: {
        summary: 'Delete a reporting period',
        description: 'Deletes a reporting period by id',
        tags: getTags('ReportingPeriods'),
        params: garboEntitySchema,
        response: {
          204: emptyBodySchema,
          ...getErrorResponseSchemas(500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params
      await reportingPeriodService.deleteReportingPeriod(id)
      reply.code(204).send()
    }
  )

  app.delete(
    '/stated-total-emissions/:id',
    {
      schema: {
        summary: 'Delete stated total emissions',
        description: 'Deletes stated total emissions by id',
        tags: getTags('ReportingPeriods'),
        params: garboEntitySchema,
        response: {
          204: emptyBodySchema,
          ...getErrorResponseSchemas(500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params
      await emissionsService.deleteStatedTotalEmissions(id)
      reply.code(204).send()
    }
  )

  app.delete(
    '/biogenic-emissions/:id',
    {
      schema: {
        summary: 'Delete a biogenic emission',
        description: 'Deletes a biogenic emission by id',
        tags: getTags('ReportingPeriods'),
        params: garboEntitySchema,
        response: {
          204: emptyBodySchema,
          ...getErrorResponseSchemas(500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params
      await emissionsService.deleteBiogenicEmissions(id)
      reply.code(204).send()
    }
  )

  app.delete(
    '/scope1/:id',
    {
      schema: {
        summary: 'Delete Scope1',
        description: 'Deletes the Scope1 emissions by id',
        tags: getTags('ReportingPeriods'),
        params: garboEntitySchema,
        response: {
          204: emptyBodySchema,
          ...getErrorResponseSchemas(500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params
      await emissionsService.deleteScope1(id)
      reply.code(204).send()
    }
  )

  app.delete(
    '/scope1and2/:id',
    {
      schema: {
        summary: 'Delete scope1and2',
        description: 'Deletes a scope1and2 by id',
        tags: getTags('ReportingPeriods'),
        params: garboEntitySchema,
        response: {
          204: emptyBodySchema,
          ...getErrorResponseSchemas(500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params
      await emissionsService.deleteScope1And2(id)
      reply.code(204).send()
    }
  )

  app.delete(
    '/scope2/:id',
    {
      schema: {
        summary: 'Delete scope2',
        description: 'Deletes a scope2 by id',
        tags: getTags('ReportingPeriods'),
        params: garboEntitySchema,
        response: {
          204: emptyBodySchema,
          ...getErrorResponseSchemas(500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params
      await emissionsService.deleteScope2(id)
      reply.code(204).send()
    }
  )

  app.delete(
    '/scope3/:id',
    {
      schema: {
        summary: 'Delete scope3',
        description: 'Deletes a scope3 by id',
        tags: getTags('ReportingPeriods'),
        params: garboEntitySchema,
        response: {
          204: emptyBodySchema,
          ...getErrorResponseSchemas(500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params
      await emissionsService.deleteScope3(id)
      reply.code(204).send()
    }
  )

  app.delete(
    '/scope3-category/:id',
    {
      schema: {
        summary: 'Delete a scope3 category',
        description: 'Deletes a scope3 category by id',
        tags: getTags('ReportingPeriods'),
        params: garboEntitySchema,
        response: {
          204: emptyBodySchema,
          ...getErrorResponseSchemas(500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params
      await emissionsService.deleteScope3Category(id)
      reply.code(204).send()
    }
  )
}
