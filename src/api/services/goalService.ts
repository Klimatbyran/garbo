import { Goal, Metadata, Prisma } from '@prisma/client'
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

export type CreateGoalsOptions = {
  /**
   * When true with a reportId, delete unverified goals for that report before
   * inserting. Pipeline bulk save sets this; editor single-creates must not.
   */
  replaceUnverifiedForReport?: boolean
}

class GoalService {
  async createGoals(
    companyId: string,
    goals: PostGoalsBody['goals'],
    createMetadata: (goal: PostGoalsBody['goals'][number]) => Promise<Metadata>,
    reportId?: string | null,
    options: CreateGoalsOptions = {}
  ) {
    const batchReportId = reportId?.trim() || null
    const replace =
      Boolean(options.replaceUnverifiedForReport) && Boolean(batchReportId)

    // Metadata rows first, then one transaction for delete+create so a failed
    // insert cannot leave a wiped report with no replacement.
    const prepared = await Promise.all(
      goals.map(async (goal) => {
        const metadata = await createMetadata(goal)
        const itemReportId =
          (typeof goal.reportId === 'string' && goal.reportId.trim()) ||
          batchReportId
        return { goal, metadata, itemReportId }
      })
    )

    return prisma.$transaction(async (tx) => {
      if (replace && batchReportId) {
        const existing = await tx.goal.findMany({
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
          await tx.metadata.deleteMany({ where: { goalId: { in: ids } } })
          await tx.goal.deleteMany({ where: { id: { in: ids } } })
        }
      }

      return Promise.all(
        prepared.map(({ goal, metadata, itemReportId }) =>
          tx.goal.create({
            data: {
              ...goalDataFields(goal),
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

    const reportConnect: Prisma.GoalUpdateInput =
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
