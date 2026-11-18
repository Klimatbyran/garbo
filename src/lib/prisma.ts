import { PrismaClient } from '@prisma/client'

const connectionString = `${process.env.DATABASE_URL}?connection_limit=10&pool_timeout=10&connect_timeout=10&statement_timeout=20000`

// TODO(Prisma 7): Driver adapters are required at runtime (e.g. @prisma/adapter-pg +
// PrismaPg). Also move DATABASE_URL into prisma.config.ts and stop passing datasources.url.
// See https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7
export const prisma = new PrismaClient({
  datasources: {
    db: { url: connectionString },
  },
})
