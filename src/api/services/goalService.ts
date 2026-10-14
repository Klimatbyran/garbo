import { Goal, Metadata } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { PostGoalBody, PostGoalsBody } from '../types'

type GoalWriteFields = {
  description: string
  year?: string | null
  target?: number | null
  baseYear?: string | null
}

function goalDataFields(goal: GoalWriteFields) {
  return {
    description: goal.description,
    year: goal.year,
    target: goal.target,
    baseYear: goal.baseYear,
  }
}

async function unverifiedIdsForReport(
  companyId: string,
  reportId: string
): Promise<string[]> {
  const existing = await prisma.goal.findMany({
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

class GoalService {
  // TODO(Klimatbyran/garbo#1333): createMetadata + goal.create should run in one $transaction.
  async createGoals(
    companyId: string,
    goals: PostGoalsBody['goals'],
    createMetadata: (goal: PostGoalsBody['goals'][number]) => Promise<Metadata>,
    reportId?: string | null
  ) {
    const trimmedReportId = reportId?.trim() || null

    if (trimmedReportId) {
      const ids = await unverifiedIdsForReport(companyId, trimmedReportId)
      if (ids.length) {
        await prisma.$transaction([
          prisma.metadata.deleteMany({ where: { goalId: { in: ids } } }),
          prisma.goal.deleteMany({ where: { id: { in: ids } } }),
        ])
      }
    }

    return Promise.all(
      goals.map(async (goal) => {
        const metadata = await createMetadata(goal)
        return prisma.goal.create({
          data: {
            ...goalDataFields(goal),
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

  async updateGoal(
    id: Goal['id'],
    goal: PostGoalBody['goal'] & { reportId?: string | null },
    metadata: Metadata
  ) {
    const {
      reportId,
      sourceReference: _sourceReference,
      pageNumber: _pageNumber,
      ...fields
    } = goal

    const reportConnect =
      reportId === undefined
        ? {}
        : reportId === null || reportId === ''
          ? { report: { disconnect: true } }
          : { report: { connect: { id: reportId } } }

    return prisma.goal.update({
      where: { id },
      data: {
        ...goalDataFields(fields),
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

  async deleteGoal(id: Goal['id']) {
    return prisma.goal.delete({ where: { id } })
  }
}
export const goalService = new GoalService()
