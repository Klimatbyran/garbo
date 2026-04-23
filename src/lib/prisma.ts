import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const pool = new Pool({
  connectionString,
  max: 10,
  connectionTimeoutMillis: 10_000,
  statement_timeout: 20_000,
})

export const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
})
