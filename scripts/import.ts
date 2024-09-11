import { Prisma, PrismaClient } from '@prisma/client'
import { exec } from 'child_process'
import { promisify } from 'util'
import { addIndustryGicsCodesToDB } from './add-gics'
import {
  getUniqueCurrenciesFromGarboData,
  importGarboData,
} from './import-garbo-companies'
import { importSpreadsheetCompanies } from './import-spreadsheet-companies'
import { isMainModule } from './utils'

export const prisma = new PrismaClient()

async function reset() {
  console.log('Resetting database and applying migrations...')
  await promisify(exec)('npx prisma migrate reset --force')
}

export async function seedDB() {
  const [[garbo, alex], currencies, gicsCodes] = await Promise.all([
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
    getUniqueCurrenciesFromGarboData(),
    addIndustryGicsCodesToDB(),
  ])

  return { users: { garbo, alex }, currencies, gicsCodes }
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

// IDEA: We could use connectOrCreate to conditionally create entities only when needed.
// TODO: Import using https://github.com/exceljs/exceljs since that seems more updated.

// Import first from facit, since we want that data as the main source.
// Import from garbo to fill in missing datapoints.
// IDEA: Maybe combine data from both data sources and import it all at the same time?
