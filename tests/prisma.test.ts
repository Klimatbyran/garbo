import { promisify } from 'util'
import { exec } from 'child_process'
import {
  prisma,
  ensureReportingPeriodExists,
  upsertCompany,
} from '../src/lib/prisma'

export async function resetDB() {
  await promisify(exec)('npx prisma db push --force-reset', {
    env: process.env,
  })
}

describe('reporting periods', () => {
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
    const companyInput = {
      wikidataId: 'Q123',
      name: 'Test company',
    }
    const company = await upsertCompany(companyInput)

    expect(company.wikidataId).toBe(companyInput.wikidataId)

    const metadata = { comment: 'test comment', userId: 1, source: '' }

    // spy on prisma.reportingPeriod.findFirst to make sure it does in fact not find anything for a new company.
    // Maybe: spy on prisma.reportingPeriod.create and make sure it creates the reportingPeriod as expected
    // or we could just check the returned value.

    const startDate = new Date('2023-01-01')
    const endDate = new Date('2023-12-31')

    // const reportingPeriod = await ensureReportingPeriodExists(
    //   company,
    //   metadata,
    //   startDate,
    //   endDate
    // )

    // console.log(reportingPeriod)

    // expect(reportingPeriod.companyId).toBe(company.wikidataId)
  })
})
