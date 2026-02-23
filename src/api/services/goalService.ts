import { Company, Goal, Metadata } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { PostGoalBody, PostGoalsBody } from '../types'

class GoalService {
  async createGoals(
    wikidataId: Company['wikidataId'],
    goals: PostGoalsBody['goals'],
    createMetadata: () => Promise<Metadata>,
  ) {
    return Promise.all(
      goals.map(async (goal) => {
        const metadata = await createMetadata()
        return prisma.goal.create({
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
      }),
    )
  }

  async updateGoal(id: Goal['id'], goal: PostGoalBody, metadata: Metadata) {
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
