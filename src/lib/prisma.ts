import { PrismaClient } from '@prisma/client'

const connectionString = `${process.env.DATABASE_URL}?connection_limit=10&pool_timeout=10&connect_timeout=10&statement_timeout=20000`

export const prisma = new PrismaClient({
  datasources: {
    db: { url: connectionString },
  },
})
