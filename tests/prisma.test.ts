import { promisify } from 'util'
import { exec } from 'child_process'
import { prisma, ensureReportingPeriodExists } from '../src/lib/prisma'

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

  it('should create a new reporting period if it does not exist', async () => {
    // TODO: create a proper company
    const company = { wikidataId: 'Q123', name: 'test company' }

    // TODO: create proper metadata
    const metadata = { comment: 'test comment', userId: 1 }

    // spy on prisma.reportingPeriod.findFirst to make sure it does in fact not find anything for a new company.
    // Maybe: spy on prisma.reportingPeriod.create and make sure it creates the reportingPeriod as expected
    // or we could just check the returned value.

    const startDate = new Date('2023-01-01')
    const endDate = new Date('2023-12-31')

    const reportingPeriod = await ensureReportingPeriodExists(
      company,
      metadata,
      startDate,
      endDate
    )

    expect(reportingPeriod.companyId).toBe(company.wikidataId)
  })
})
