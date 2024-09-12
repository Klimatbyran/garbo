import { Prisma, PrismaClient } from '@prisma/client'
import { exec } from 'child_process'
import { promisify } from 'util'
import { addIndustryGicsCodesToDB } from './add-gics'
import { importGarboData } from './import-garbo-companies'
import { importSpreadsheetCompanies } from './import-spreadsheet-companies'
import { isMainModule } from './utils'

export const prisma = new PrismaClient()

async function reset() {
  console.log('Resetting database and applying migrations...')
  await promisify(exec)('npx prisma migrate reset --force')
}

export const DATA_ORIGIN = {
  garbo: 'garbo',
  manual: 'manual',
}

export type DataOrigin = keyof typeof DATA_ORIGIN

export type CompanyInput = {
  wikidataId: string
  name: string
  description?: string
  reportingPeriods: ReportingPeriodInput[]
}

export type MetadataInput = {
  comment?: string
  source?: string
}

export type ReportingPeriodInput = {
  startDate: Date
  endDate: Date
  companyId: string
  metadata: MetadataInput
  emissions: EmissionsInput
}

export type EmissionsInput = {
  scope1?: Scope1Input
  scope2?: Scope2Input
  metadata: MetadataInput
}

export type Scope1Input = {
  total?: number
  metadata: MetadataInput
}

export type Scope2Input = {
  mb?: number
  lb?: number
  unknown?: number
  metadata: MetadataInput
}

export async function seedDB() {
  const [[garbo, alex], gicsCodes] = await Promise.all([
    prisma.user.createManyAndReturn({
      data: [
        {
          email: 'hej@klimatkollen.se',
          name: 'Garbo (Klimatkollen)',
        },
        {
          email: 'alex@klimatkollen.se',
          name: 'Alexandra Palmquist',
        },
      ],
    }),
    addIndustryGicsCodesToDB(),
  ])

  return { users: { garbo, alex }, gicsCodes }
}

export type InitialDBState = Awaited<ReturnType<typeof seedDB>>

async function main() {
  await reset()
  const seededData = await seedDB()

  await importGarboData(seededData)
  await importSpreadsheetCompanies()
}

if (isMainModule(import.meta.url)) {
  await main()
}
