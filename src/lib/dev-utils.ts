import { promisify } from 'util'
import { prisma } from './prisma'
import { exec } from 'child_process'

/**
 * Reset the Postgres DB. Should only be run in development.
 */
export async function resetDB() {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ')

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
  } catch (error) {
    console.log({ error })
  }

  await promisify(exec)(`npx prisma db seed`, {
    env: process.env,
  })
}
