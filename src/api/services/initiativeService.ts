import { Initiative, Metadata } from '@prisma/client'
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

async function unverifiedIdsForReport(
  companyId: string,
  reportId: string
): Promise<string[]> {
  const existing = await prisma.initiative.findMany({
    where: { companyId, reportId },
    select: {
      id: true,
      metadata: {
        orderBy: { updatedAt: 'desc' },
        take: 1,
        select: { verifiedByUserId: true },
      },
    },
  })
  return existing
    .filter((row) => !row.metadata[0]?.verifiedByUserId)
    .map((row) => row.id)
}

class InitiativeService {
  async createInitiatives(
    companyId: string,
    initiatives: PostInitiativesBody['initiatives'],
    createMetadata: (
      initiative: PostInitiativesBody['initiatives'][number]
    ) => Promise<Metadata>,
    reportId?: string | null
  ) {
    const trimmedReportId = reportId?.trim() || null

    if (trimmedReportId) {
      const ids = await unverifiedIdsForReport(companyId, trimmedReportId)
      if (ids.length) {
        await prisma.$transaction([
          prisma.metadata.deleteMany({
            where: { initiativeId: { in: ids } },
          }),
          prisma.initiative.deleteMany({ where: { id: { in: ids } } }),
        ])
      }
    }

    return Promise.all(
      initiatives.map(async (initiative) => {
        const metadata = await createMetadata(initiative)
        return prisma.initiative.create({
          data: {
            ...initiativeDataFields(initiative),
            company: { connect: { id: companyId } },
            ...(trimmedReportId
              ? { report: { connect: { id: trimmedReportId } } }
              : {}),
            metadata: { connect: { id: metadata.id } },
          },
          select: { id: true },
        })
      })
    )
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

    const reportConnect =
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
