/**
 * Seed only tag options (no users, no GICS).
 * Usage:
 *   npm run seed:tags
 *   # or from inside a k8s pod (staging namespace):
 *   kubectl exec -it deployment/garbo -c garbo -n garbo-stage -- npm run seed:tags
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TAG_OPTIONS = [
  { slug: 'public', label: 'Publicly traded companies' },
  { slug: 'large-cap', label: 'Large cap' },
  { slug: 'mid-cap', label: 'Mid cap' },
  { slug: 'state-owned', label: 'State owned' },
  { slug: 'municipality-owned', label: 'Municipality owned' },
  { slug: 'private', label: 'Private' },
  { slug: 'small-cap', label: 'Small cap' },
  { slug: 'baltics', label: 'Baltic countries' },
] as const

async function main() {
  for (const option of TAG_OPTIONS) {
    await prisma.tagOption.upsert({
      where: { slug: option.slug },
      create: option,
      update: { label: option.label },
    })
  }
  console.log(`Seeded ${TAG_OPTIONS.length} tag options.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
