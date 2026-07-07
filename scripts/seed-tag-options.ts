/**
 * Seed only tag options (no users, no GICS).
 * Usage:
 *   npm run seed:tags
 *   # or from inside a k8s pod (staging namespace):
 *   kubectl exec -it deployment/garbo -c garbo -n garbo-stage -- npm run seed:tags
 */
import 'dotenv/config'
import { PrismaClient, TagOptionType } from '@prisma/client'

const prisma = new PrismaClient()

const TAG_OPTIONS: {
  slug: string
  label: string
  type: TagOptionType
}[] = [
  { slug: 'public', label: 'Publicly traded companies', type: 'OWNERSHIP' },
  { slug: 'large-cap', label: 'Large cap', type: 'MARKET_CAP' },
  { slug: 'mid-cap', label: 'Mid cap', type: 'MARKET_CAP' },
  { slug: 'state-owned', label: 'State owned', type: 'OWNERSHIP' },
  {
    slug: 'municipality-owned',
    label: 'Municipality owned',
    type: 'OWNERSHIP',
  },
  { slug: 'private', label: 'Private', type: 'OWNERSHIP' },
  { slug: 'small-cap', label: 'Small cap', type: 'MARKET_CAP' },
  { slug: 'baltics', label: 'Baltic countries', type: 'REGION' },
  { slug: 'sweden', label: 'Sweden', type: 'COUNTRY' },
  { slug: 'norway', label: 'Norway', type: 'COUNTRY' },
  { slug: 'finland', label: 'Finland', type: 'COUNTRY' },
  { slug: 'denmark', label: 'Denmark', type: 'COUNTRY' },
  { slug: 'iceland', label: 'Iceland', type: 'COUNTRY' },
]

async function main() {
  for (const option of TAG_OPTIONS) {
    await prisma.tagOption.upsert({
      where: { slug: option.slug },
      create: option,
      update: { label: option.label, type: option.type },
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
