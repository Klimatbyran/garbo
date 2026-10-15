import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'

import { getTags } from '../../../config/openapi'
import { metadataService } from '../../services/metadataService'
import { companyService } from '../../services/companyService'
import {
  companyIdParamSchema,
  companyInitiativeParamsSchema,
  okResponseSchema,
  postInitiativeSchema,
  postInitiativesSchema,
  getErrorSchemas,
} from '../../schemas'
import { initiativeService } from '../../services/initiativeService'
import {
  CompanyIdParams,
  PostInitiativeBody,
  PostInitiativesBody,
  CompanyInitiativeParams,
} from '../../types'
import { provenanceMetadataFields } from '../../../lib/sourceReference'

export async function companyInitiativesRoutes(app: FastifyInstance) {
  app.post(
    '/:id/initiatives',
    {
      schema: {
        summary: 'Create company initiatives',
        description: 'Create new initiatives for a company',
        tags: getTags('Initiatives'),
        params: companyIdParamSchema,
        body: postInitiativesSchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: CompanyIdParams
        Body: PostInitiativesBody
      }>,
      reply
    ) => {
      const {
        initiatives,
        metadata,
        reportId,
        reportS3Url,
        verified,
        replaceUnverifiedForReport,
      } = request.body

      const rows = initiatives ?? []
      // Empty array + replace still needs the service so unverified
      // same-report rows are cleared when re-extraction finds nothing.
      const mustReplace =
        Boolean(replaceUnverifiedForReport) && Boolean(reportId?.trim())

      if (rows.length || mustReplace) {
        const { id } = request.params

        try {
          const company = await companyService.getCompanyByInternalId(id)
          await initiativeService.createInitiatives(
            company.id,
            rows,
            (initiative) =>
              metadataService.createMetadata({
                metadata: provenanceMetadataFields(
                  initiative,
                  metadata,
                  reportS3Url
                ),
                user: request.user,
                verified: Boolean(verified),
              }),
            reportId,
            { replaceUnverifiedForReport }
          )
        } catch (error) {
          console.error('ERROR Creation of initiatives failed:', error)
          return reply
            .status(500)
            .send({ message: 'Initiatives could not be created.' })
        }
      }
      return reply.send({ ok: true })
    }
  )

  app.patch(
    '/:id/initiatives/:initiativeId',
    {
      schema: {
        summary: 'Update a company initiative',
        description: 'Update an existing initiative for a company',
        tags: getTags('Initiatives'),
        params: companyInitiativeParamsSchema,
        body: postInitiativeSchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: CompanyInitiativeParams
        Body: PostInitiativeBody
      }>,
      reply
    ) => {
      const { initiativeId } = request.params
      const { initiative, metadata, verified } = request.body
      const createdMetadata = await metadataService.createMetadata({
        metadata: provenanceMetadataFields(initiative, metadata),
        user: request.user,
        verified: Boolean(verified),
      })

      try {
        await initiativeService.updateInitiative(
          initiativeId,
          initiative,
          createdMetadata
        )
      } catch (error) {
        console.error('ERROR Update of initiative failed:', error)
        return reply
          .status(500)
          .send({ message: 'Update of initiative failed.' })
      }

      return reply.send({ ok: true })
    }
  )
}
