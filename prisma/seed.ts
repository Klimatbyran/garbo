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

async function development() {
  await common()
}

async function test() {
  await common()
}

async function main() {
  switch (process.env.NODE_ENV) {
    case 'development':
      await development()
      break
    case 'test':
      await test()
      break
    default:
      break
  }
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
