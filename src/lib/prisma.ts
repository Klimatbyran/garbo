import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

/** Shared factory so scripts and the app use the same Prisma 7 adapter wiring. */
export function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to create PrismaClient')
  }

  // Pool settings previously lived as query params on DATABASE_URL
  // (`connection_limit`, `pool_timeout`, `connect_timeout`, `statement_timeout`).
  // Prisma 7 driver adapters use the underlying `pg` pool instead.
  const pool = new Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000,
    statement_timeout: 20_000,
  })

  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = createPrismaClient()
