/**
 * Seeds only the client API roles, permissions, and optional dev keys.
 * Safe to run in production without touching any other seed data.
 *
 * Usage:
 *   npm run seed:client-api
 *
 * Requires DATABASE_URL and API_SECRET (or CLIENT_API_KEY_PEPPER) in the environment.
 * Optionally set GARBO_SEED_FIRST_PARTY_CLIENT_API_KEY and/or
 * GARBO_SEED_PARTNER_CLIENT_API_KEY to also upsert seed keys.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { seedClientApi } from '../prisma/seedClientApi'

const prisma = new PrismaClient()

seedClientApi(prisma)
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
