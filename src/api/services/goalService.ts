import { Company, Goal, Metadata, Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { DefaultGoal } from '../types'
import { GarboAPIError } from '../../lib/garbo-api-error'

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
    try {
      return await prisma.goal.delete({ where: { id } })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new GarboAPIError('Goal not found', { statusCode: 404 })
      }
      throw error
    }
  }
}
export const goalService = new GoalService()
