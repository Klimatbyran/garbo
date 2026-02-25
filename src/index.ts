import { parseArgs } from 'node:util'
import { PrismaClient } from '@prisma/client'

import startApp from './app'
import apiConfig from './config/api'
import openAPIConfig from './config/openapi'
import { createServerCache } from './createCache'

export const redisCache = createServerCache({ maxAge: 24 * 60 * 60 * 1000 })

const { values } = parseArgs({
  options: {
    'api-only': {
      type: 'boolean',
      default: false,
    },
  },
})

const START_BOARD = !values['api-only']
const port = apiConfig.port

const prisma = new PrismaClient()
const app = await startApp()

async function main() {
  try {
    if (START_BOARD) {
      const bullBoard = (await import('./bull-board')).default
      app.register(bullBoard, {
        logLevel: 'silent',
        prefix: apiConfig.bullBoardBasePath,
      })
    }

    await app.ready()

    app.listen(
      {
        host: '0.0.0.0',
        port: apiConfig.port,
      },
      async () => {
        const logMessages = [
          `API running at http://localhost:${port}/api/companies`,
          `OpenAPI docs served at http://localhost:${port}/${openAPIConfig.prefix}`,
        ]

        if (START_BOARD) {
          const discord = (await import('./discord')).default
          await discord.login()
          logMessages.push(
            `See the UI for the Garbo pipeline at http://localhost:${port}/admin/queues`
          )
        }

        logMessages.forEach((msg) => app.log.info(msg))
      }
    )
  } catch (e) {
    app.log.error(e)
    process.exit(1)
  }
}

await main()

async function findAndDeleteOrphanedMetadata() {
  const orphanedMetadata = await prisma.metadata.findMany({
    where: {
      AND: [
        { goalId: null },
        { initiativeId: null },
        { scope1Id: null },
        { scope2Id: null },
        { scope3Id: null },
        { scope1And2Id: null },
        { reportingPeriodId: null },
        { baseYearId: null },
        { biogenicEmissionsId: null },
        { statedTotalEmissionsId: null },
        { industryId: null },
        { categoryId: null },
        { turnoverId: null },
        { employeesId: null },
      ],
    },
  })

  app.log.info(`Found ${orphanedMetadata.length} orphaned metadata records.`)

  if (orphanedMetadata.length > 0) {
    const deleted = await prisma.metadata.deleteMany({
      where: {
        id: { in: orphanedMetadata.map((m) => m.id) },
      },
    })

    app.log.info(`Deleted ${deleted.count} orphaned metadata records.`)
  }
}

setInterval(
  () => {
    findAndDeleteOrphanedMetadata()
  },
  1000 * 60 * 60 * 24
)
