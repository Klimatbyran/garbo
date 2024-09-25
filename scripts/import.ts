import { Prisma, PrismaClient } from '@prisma/client'
import { getAllGicsCodesLookup } from './add-gics'
import { importGarboData } from './import-garbo-companies'
// import { importSpreadsheetCompanies } from './import-spreadsheet-companies'
import { isMainModule } from './utils'
import { resetDB } from '../src/lib/dev-utils'

export const prisma = new PrismaClient()

export const DATA_ORIGIN = {
  garbo: 'garbo',
  manual: 'manual',
}

export type DataOrigin = keyof typeof DATA_ORIGIN

export type CompanyInput = {
  wikidataId: string
  name: string
  description?: string
  internalComment?: string
  industry?: {
    subIndustryCode: string
    industryCode: string
  }
  reportingPeriods: ReportingPeriodInput[]
}

export type MetadataInput = {
  comment?: string
  source?: string
}

export type ReportingPeriodInput = {
  startDate: Date
  endDate: Date
  reportURL?: string
  companyId: string
  emissions?: EmissionsInput
  economy?: EconomyInput
}

export type EmissionsInput = {
  scope1?: Scope1Input
  scope2?: Scope2Input
  scope3?: Scope3Input
  statedTotalEmissions?: StatedTotalEmissionsInput
  biogenic?: BiogenicInput
}

export type Scope1Input = {
  total?: number
}

export type Scope2Input = {
  mb?: number
  lb?: number
  unknown?: number
}

export type Scope3Input = {
  scope3Categories?: Scope3CategoryInput[]
  statedTotalEmissions?: StatedTotalEmissionsInput
}

export type Scope3CategoryInput = {
  category: number
  total: number
}

export type StatedTotalEmissionsInput = {
  total: number
}

export type BiogenicInput = {
  total: number
}

export type EconomyInput = {
  turnover?: {
    value?: number
    currency?: string
  }
  employees?: {
    value?: number
    unit?: string
  }
}

export async function getSeededData() {
  const [[garbo, alex], gicsCodes] = await Promise.all([
    prisma.user.findMany(),
    getAllGicsCodesLookup(),
  ])

  return { users: { garbo, alex }, gicsCodes }
}

export type InitialDBState = Awaited<ReturnType<typeof getSeededData>>

async function main() {
  await resetDB()
  const seededData = await getSeededData()

  await importGarboData(seededData)
  // TODO: Combine into one import for all data. First adding garbo data and then from the spreadsheet
  // await importSpreadsheetCompanies()
}

if (isMainModule(import.meta.url)) {
  await main()
}
