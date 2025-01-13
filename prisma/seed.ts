import { PrismaClient } from '@prisma/client'
import { seedGicsCodes } from '../scripts/add-gics'

const prisma = new PrismaClient()

async function seedUsers() {
  return prisma.user2.createMany({
    data: [
      {
        email: 'hej@klimatkollen.se',
        name: 'Garbo (Klimatkollen)',
      },
      {
        email: 'alex@klimatkollen.se',
        name: 'Alex (Klimatkollen)',
      },
    ],
  })
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
