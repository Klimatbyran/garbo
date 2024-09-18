import { promisify } from 'util'
import { exec } from 'child_process'
import { prisma, upsertReportingPeriod } from '../src/lib/prisma'

export async function resetDB() {
  console.log('Resetting testing database')
  await promisify(exec)('npx prisma db push --force-reset', {
    env: process.env,
  })
}

describe('Prisma DB queries and mutations', () => {
  beforeAll(async () => {
    await resetDB()
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should find no existing reportingPeriods with an empty testing DB', async () => {
    const reportingPeriods = await prisma.reportingPeriod.findMany()

    expect(reportingPeriods.length).toBe(0)
  })
})
