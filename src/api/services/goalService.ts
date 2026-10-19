import { Goal, Metadata } from '@prisma/client'
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
import { PostGoalBody, PostGoalsBody } from '../types'

function goalDataFields(goal: PostGoalsBody['goals'][number]) {
  return {
    description: goal.description,
    originalQuote: goal.originalQuote,
    year: goal.year,
    targetType: goal.targetType,
    targetDirection: goal.targetDirection,
    target: goal.target,
    unit: goal.unit,
    intensityMetric: goal.intensityMetric,
    horizon: goal.horizon,
    isSbtiTarget: goal.isSbtiTarget,
    baseYear: goal.baseYear,
    baseYearSource: goal.baseYearSource,
  }
}

export type CreateGoalsOptions = CreateWithReportOptions

class GoalService {
  async createGoals(
    companyId: string,
    goals: PostGoalsBody['goals'],
    createMetadata: (goal: PostGoalsBody['goals'][number]) => Promise<Metadata>,
    reportId?: string | null,
    options: CreateGoalsOptions = {}
  ) {
    const batchReportId = resolveBatchReportId(reportId)
    const replace = shouldReplaceUnverifiedForReport(options, batchReportId)

    // Metadata rows first, then one transaction for delete+create so a failed
    // insert cannot leave a wiped report with no replacement.
    const prepared = await Promise.all(
      goals.map(async (goal) => {
        const metadata = await createMetadata(goal)
        const itemReportId = resolveItemReportId(goal.reportId, batchReportId)
        return { goal, metadata, itemReportId }
      })
    )

    return prisma.$transaction(async (tx) => {
      if (replace && batchReportId) {
        await deleteUnverifiedForReport(tx, {
          companyId,
          reportId: batchReportId,
          entity: 'goal',
        })
      }

      return Promise.all(
        prepared.map(({ goal, metadata, itemReportId }) =>
          tx.goal.create({
            data: {
              ...goalDataFields(goal),
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

    return prisma.goal.update({
      where: { id },
      data: {
        ...goalDataFields(fields),
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

  async deleteGoal(id: Goal['id']) {
    return prisma.goal.delete({ where: { id } })
  }
}
export const goalService = new GoalService()
