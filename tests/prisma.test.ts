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
  }, 10000) // Increase timeout to 10 seconds

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should find no existing reportingPeriods with an empty testing DB', async () => {
    const reportingPeriods = await prisma.reportingPeriod.findMany()

    expect(reportingPeriods.length).toBe(0)
  }, 10000) // Increase timeout to 10 seconds

  it('should create a new reporting period if it does not exist', async () => {
    // Create a proper company entry
    const company = await prisma.company.create({
      data: {
        wikidataId: 'Q123',
        name: 'test company',
        description: null,
        url: null,
        internalComment: null,
      },
    })

    // Create a proper user entry
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    })

    // Create proper metadata entry
    const metadata = await prisma.metadata.create({
      data: {
        comment: 'test comment',
        userId: user.id,
      },
    })

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
  }, 10000) // Increase timeout to 10 seconds
})
