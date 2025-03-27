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

async function main() {
  await Promise.all([seedGicsCodes(), seedUsers()])
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
