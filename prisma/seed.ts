import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { seedGicsCodes } from '../scripts/add-gics'

const prisma = new PrismaClient()

async function seedUsers() {
  const users = [
    {
      email: 'hej@klimatkollen.se',
      name: 'Garbo (Klimatkollen)',
    },
    {
      email: 'alex@klimatkollen.se',
      name: 'Alex (Klimatkollen)',
    },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { name: user.name },
      create: user,
      update: user,
      select: { id: true },
    })
  }
}

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

async function seedTagOptions() {
  for (const option of TAG_OPTIONS) {
    await prisma.tagOption.upsert({
      where: { slug: option.slug },
      create: option,
      update: { label: option.label },
    })
  }
}

async function main() {
  await Promise.all([seedGicsCodes(), seedUsers(), seedTagOptions()])
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
