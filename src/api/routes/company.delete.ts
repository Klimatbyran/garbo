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
import { redisCache } from '../..'
import { baseYearService } from '../services/baseYearService'

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
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: WikidataIdParams }>,
      reply
    ) => {
      const { wikidataId } = request.params;
      redisCache.clear();
      try {
        await companyService.deleteCompany(wikidataId);
      } catch(error) {
        console.error('ERROR Deletion of company failed:', error);
        return reply.status(500).send({message: 'Deletion of company failed.'});
      }
      return reply.status(204).send();
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
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params;
      redisCache.clear();
      try {
        await goalService.deleteGoal(id)
      } catch(error) {
        console.error('ERROR Deletion of goal failed:', error);
        return reply.status(500).send({message: 'Deletion of goal failed.'});
      }
      
      return reply.status(204).send();
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
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: WikidataIdParams }>,
      reply
    ) => {
      const { wikidataId } = request.params;
      redisCache.clear();
      try{
        await industryService.deleteIndustry(wikidataId);
      } catch(error) {
        console.error('ERROR deletion of industry failed:', error);
        return reply.status(500).send({message: 'Deletion of industry failed.'});
      }
      return reply.status(204).send();
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
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      req: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = req.params;
      redisCache.clear();
      try {
        await initiativeService.deleteInitiative(id);
      } catch(error) {
        console.error('ERROR Deletion of initiative failed:', error);
        return reply.status(500).send({message: 'Deletion of initiative failed.'});
      }
      
      return reply.code(204).send();
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
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params;
      redisCache.clear();
      try {
        await reportingPeriodService.deleteReportingPeriod(id);
      } catch (error) {
        console.error('ERROR Deletion of reporting period failed:', error);
        return reply.status(500).send({ message: 'Deletion of reporting period failed.' });
      }
      return reply.code(204).send();
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
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params;
      redisCache.clear();
      try {
        await emissionsService.deleteStatedTotalEmissions(id);
      } catch(error) {
        console.error('ERROR Deletion of stated total emissions failed:', error);
        return reply.code(500).send({message: "Deletion of stated total emissions failed."});
      }
      
      return reply.code(204).send();
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
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params;
      redisCache.clear();
      
      try {
        await emissionsService.deleteBiogenicEmissions(id);
      } catch (error) {
        console.error('ERROR Deletion of biogenic emissions failed:', error);
        return reply.code(500).send({ message: "Deletion of biogenic emissions failed." });
      }

      return reply.code(204).send();
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
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params;
      redisCache.clear();
      try {
        await emissionsService.deleteScope1(id);
      } catch (error) {
        console.error('ERROR Deletion of Scope1 emissions failed:', error);
        return reply.code(500).send({ message: "Deletion of Scope1 emissions failed." });
      }

      return reply.code(204).send();
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
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params;
      redisCache.clear();
      try {
        await emissionsService.deleteScope1And2(id);
      } catch (error) {
        console.error('ERROR Deletion of Scope1and2 emissions failed:', error);
        return reply.code(500).send({ message: "Deletion of Scope1and2 emissions failed." });
      }
      return reply.code(204).send();
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
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params;
      redisCache.clear();
      try {
        await emissionsService.deleteScope2(id);
      } catch (error) {
        console.error('ERROR Deletion of Scope2 emissions failed:', error);
        return reply.code(500).send({ message: "Deletion of Scope2 emissions failed." });
      }
      return reply.code(204).send();
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
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params;
      redisCache.clear();
      try {
        await emissionsService.deleteScope3(id);
      } catch (error) {
        console.error('ERROR Deletion of Scope3 emissions failed:', error);
        return reply.code(500).send({ message: "Deletion of Scope3 emissions failed." });
      }
      return reply.code(204).send();
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
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params;
      redisCache.clear();
      try {
        await emissionsService.deleteScope3Category(id);
      } catch (error) {
        console.error('ERROR Deletion of Scope3 category failed:', error);
        return reply.code(500).send({ message: "Deletion of Scope3 category failed." });
      }
      return reply.code(204).send();
    }
  )
  
  app.delete(
    '/base-year/:id',
    {
      schema: {
        summary: 'Delete a base year',
        description: 'Delete a base year by id',
        tags: getTags('Emissions'),
        params: garboEntityIdSchema,
        response: {
          204: emptyBodySchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Params: GarboEntityId }>,
      reply
    ) => {
      const { id } = request.params;
      redisCache.clear();
      try {
        await baseYearService.deleteBaseYear(id);
      } catch (error) {
        console.error('ERROR Deletion of base year failed:', error);
        return reply.code(500).send({ message: "Deletion of base year failed." });
      }
      return reply.code(204).send();
    }
  )
}
