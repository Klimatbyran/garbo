import { promisify } from 'util'
import { prisma } from './prisma'
import { exec } from 'child_process'

export async function resetDB() {
  // NOTE: The order is very important, and connected to the way relations are set up.
  // Start by deleting the tables that have relations to others
  // Finally, delete the tables that are connected to many other ones
  await prisma.$transaction([
    prisma.goal.deleteMany(),
    prisma.initiative.deleteMany(),
    prisma.scope1.deleteMany(),
    prisma.scope2.deleteMany(),
    prisma.statedTotalEmissions.deleteMany(),
    prisma.scope1And2.deleteMany(),
    prisma.emissions.deleteMany(),
    prisma.biogenicEmissions.deleteMany(),
    prisma.baseYear.deleteMany(),
    prisma.turnover.deleteMany(),
    prisma.economy.deleteMany(),
    prisma.scope3Category.deleteMany(),
    prisma.scope3.deleteMany(),
    prisma.industry.deleteMany(),
    prisma.industryGics.deleteMany(),
    prisma.reportingPeriod.deleteMany(),
    prisma.company.deleteMany(),
    prisma.metadata.deleteMany(),
    prisma.user.deleteMany(),
  ])

  await promisify(exec)(`npx prisma db seed`, {
    env: process.env,
  })
}
