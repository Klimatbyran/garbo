import { Company, Goal, Metadata } from '@prisma/client'
import { OptionalNullable } from '../../lib/type-utils'
import { prisma } from '../..'
import { DefaultGoal } from '../types'

class GoalService {
  async createGoals(
    wikidataId: Company['wikidataId'],
    goals: DefaultGoal[],
    metadata: Metadata
  ) {
    return prisma.$transaction(
      goals.map((goal) =>
        prisma.goal.create({
          data: {
            ...goal,
            description: goal.description,
            company: {
              connect: {
                wikidataId,
              },
            },
            metadata: {
              connect: {
                id: metadata.id,
              },
            },
          },
          select: { id: true },
        })
      )
    )
  }

  async updateGoal(id: Goal['id'], goal: DefaultGoal, metadata: Metadata) {
    return prisma.goal.update({
      where: { id },
      data: {
        ...goal,
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
