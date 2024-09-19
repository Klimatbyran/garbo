import { promisify } from 'util'
import { prisma } from './prisma'
import { exec } from 'child_process'

export async function resetDB() {
  const allTables = await prisma.$queryRaw<
    { name: string }[]
  >`SELECT name FROM sqlite_master WHERE type='table';`

  const systemTables = ['sqlite_sequence', '_prisma_migrations']
  const tables = allTables.filter(({ name }) => !systemTables.includes(name))

  try {
    for (const { name } of tables) {
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
