import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  // Allow unit tests to import modules that depend on prisma without requiring
  // a real DB connection string. Tests that need the DB should set DATABASE_URL.
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('DATABASE_URL is not set')
  }
}

const pool = new Pool({
  connectionString: connectionString ?? 'postgresql://localhost:5432/postgres',
  max: connectionString ? 10 : 0,
  connectionTimeoutMillis: 10_000,
  statement_timeout: 20_000,
})

export const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
})
