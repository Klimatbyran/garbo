import { promisify } from 'util'
import { prisma } from './prisma'
import { exec } from 'child_process'

export async function resetDB() {
  const allTables = await prisma.$queryRaw<
    { name: string }[]
  >`SELECT name FROM sqlite_master WHERE type='table';`

  const systemTables = ['sqlite_sequence', '_prisma_migrations']
  const tables = allTables.filter(({ name }) => !systemTables.includes(name))

  // IMPORTANT: The tables have to be deleted in a specific order because of their relations.
  // Starting with the Tables with few relations and only deleting tables that have many relations at the very end.
  // A bit tedious, but much faster than doing a full prisma reset and re-applying migrations.
  const orderedTables = [
    'Goal',
    'Initiative',
    'Scope1',
    'Scope2',
    'Scope3',
    'Scope3Category',
    'Scope1And2',
    'StatedTotalEmissions',
    'BiogenicEmissions',
    'Emissions',
    'BaseYear',
    'Turnover',
    'Employees',
    'Economy',
    'Industry',
    'IndustryGics',
    'ReportingPeriod',
    'Company',
    'Metadata',
    'User',
  ]

  const unknownTables = tables.filter(
    ({ name }) => !orderedTables.includes(name)
  )

  if (unknownTables.length) {
    throw new Error(
      'Please add the following unknown tables to the DB reset script (and delete them in the right order):' +
        unknownTables.join(', ')
    )
  }

  try {
    for (const name of orderedTables) {
      await prisma.$executeRawUnsafe(`DELETE FROM ${name};`)
      await prisma.$executeRawUnsafe(
        `DELETE FROM sqlite_sequence WHERE name='${name}';`
      )
    }
  } catch (error) {
    console.log({ error })
  }

  await promisify(exec)(`npx prisma db seed`, {
    env: process.env,
  })
}
