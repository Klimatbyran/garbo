import { Initiative, Metadata } from '@prisma/client'
import {
  CreateWithReportOptions,
  deleteUnverifiedForReport,
  reportConnectCreate,
  reportRelationUpdate,
  resolveBatchReportId,
  resolveItemReportId,
  shouldReplaceUnverifiedForReport,
} from '../../lib/goalInitiativeReport'
import { prisma } from '../../lib/prisma'
import { PostInitiativeBody, PostInitiativesBody } from '../types'

type InitiativeWriteFields = {
  title: string
  description?: string | null
  year?: string | null
  scope?: string | null
}

function initiativeDataFields(initiative: InitiativeWriteFields) {
  return {
    title: initiative.title,
    description: initiative.description,
    year: initiative.year,
    scope: initiative.scope,
  }
}

export type CreateInitiativesOptions = CreateWithReportOptions

class InitiativeService {
  async createInitiatives(
    companyId: string,
    initiatives: PostInitiativesBody['initiatives'],
    createMetadata: (
      initiative: PostInitiativesBody['initiatives'][number]
    ) => Promise<Metadata>,
    reportId?: string | null,
    options: CreateInitiativesOptions = {}
  ) {
    const batchReportId = resolveBatchReportId(reportId)
    const replace = shouldReplaceUnverifiedForReport(options, batchReportId)

    const prepared = await Promise.all(
      initiatives.map(async (initiative) => {
        const metadata = await createMetadata(initiative)
        const itemReportId = resolveItemReportId(
          initiative.reportId,
          batchReportId
        )
        return { initiative, metadata, itemReportId }
      })
    )

    return prisma.$transaction(async (tx) => {
      if (replace && batchReportId) {
        await deleteUnverifiedForReport(tx, {
          companyId,
          reportId: batchReportId,
          entity: 'initiative',
        })
      }

      return Promise.all(
        prepared.map(({ initiative, metadata, itemReportId }) =>
          tx.initiative.create({
            data: {
              ...initiativeDataFields(initiative),
              company: { connect: { id: companyId } },
              ...reportConnectCreate(itemReportId),
              metadata: { connect: { id: metadata.id } },
            },
            select: { id: true },
          })
        )
      )
    })
  }

  async updateInitiative(
    id: Initiative['id'],
    initiative: PostInitiativeBody['initiative'] & {
      reportId?: string | null
    },
    metadata: Metadata
  ) {
    const {
      reportId,
      sourceReference: _sourceReference,
      pageNumber: _pageNumber,
      ...fields
    } = initiative

    return prisma.initiative.update({
      where: { id },
      data: {
        ...initiativeDataFields(fields),
        ...reportRelationUpdate(reportId),
        metadata: {
          connect: {
            id: metadata.id,
          },
        },
      },
      select: { id: true },
    })
  }

  async deleteInitiative(id: Initiative['id']) {
    return await prisma.initiative.delete({ where: { id } })
  }
}

export const initiativeService = new InitiativeService()
