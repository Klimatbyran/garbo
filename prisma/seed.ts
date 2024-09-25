import { PrismaClient } from '@prisma/client'
import { seedGicsCodes } from '../scripts/add-gics'

const prisma = new PrismaClient()

async function seedUsers() {
  return prisma.user.createMany({
    data: [
      {
        email: 'hej@klimatkollen.se',
        name: 'Garbo (Klimatkollen)',
      },
      {
        email: 'alex@klimatkollen.se',
        name: 'Alexandra Palmquist',
      },
    ],
  })
}

async function common() {
  return Promise.all([seedGicsCodes(), seedUsers()])
}

async function main() {
  common()
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
