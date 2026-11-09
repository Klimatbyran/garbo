import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Prefer process.env over prisma/config `env()` so `prisma generate` (CI,
// Docker `npm ci` postinstall) works without a real DATABASE_URL. Migrate and
// the app still require a real URL at runtime.
const datasourceUrl =
  process.env.DATABASE_URL ?? 'postgresql://prisma:prisma@127.0.0.1:5432/prisma'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: datasourceUrl,
  },
})
