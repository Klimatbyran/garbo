import { Initiative, Metadata, Prisma } from '@prisma/client'
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

export type CreateInitiativesOptions = {
  /**
   * When true with a reportId, delete unverified initiatives for that report
   * before inserting. Pipeline bulk save sets this; editor single-creates must not.
   */
  replaceUnverifiedForReport?: boolean
}

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
    const batchReportId = reportId?.trim() || null
    const replace =
      Boolean(options.replaceUnverifiedForReport) && Boolean(batchReportId)

    const prepared = await Promise.all(
      initiatives.map(async (initiative) => {
        const metadata = await createMetadata(initiative)
        const itemReportId =
          (typeof initiative.reportId === 'string' &&
            initiative.reportId.trim()) ||
          batchReportId
        return { initiative, metadata, itemReportId }
      })
    )

    return prisma.$transaction(async (tx) => {
      if (replace && batchReportId) {
        const existing = await tx.initiative.findMany({
          where: { companyId, reportId: batchReportId },
          select: {
            id: true,
            metadata: {
              orderBy: { updatedAt: 'desc' },
              take: 1,
              select: { verifiedByUserId: true },
            },
          },
        })
        const ids = existing
          .filter((row) => !row.metadata[0]?.verifiedByUserId)
          .map((row) => row.id)
        if (ids.length) {
          await tx.metadata.deleteMany({
            where: { initiativeId: { in: ids } },
          })
          await tx.initiative.deleteMany({ where: { id: { in: ids } } })
        }
      }

      return Promise.all(
        prepared.map(({ initiative, metadata, itemReportId }) =>
          tx.initiative.create({
            data: {
              ...initiativeDataFields(initiative),
              company: { connect: { id: companyId } },
              ...(itemReportId
                ? { report: { connect: { id: itemReportId } } }
                : {}),
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

    const reportConnect: Prisma.InitiativeUpdateInput =
      reportId === undefined
        ? {}
        : reportId === null || reportId === ''
          ? { report: { disconnect: true } }
          : { report: { connect: { id: reportId } } }

    return prisma.initiative.update({
      where: { id },
      data: {
        ...initiativeDataFields(fields),
        ...reportConnect,
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
