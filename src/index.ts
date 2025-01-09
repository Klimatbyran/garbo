import express from 'express'
import { parseArgs } from 'node:util'
import { PrismaClient } from '@prisma/client'

import api from './api'
import apiConfig from './config/api'

const prisma = new PrismaClient()

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
const app = express()

app.get('/favicon.ico', express.static('public/favicon.png'))
app.use('/api', api)

app.get('/', (req, res) => {
  res.redirect('/api')
})

if (START_BOARD) {
  const queue = (await import('./queue')).default
  app.use('/admin/queues', queue)
  app.get('/', (req, res) => {
    res.send(
      `Hi I'm Garbo!
      Queues: <br>
      <a href="/admin/queues">/admin/queues</a>`
    )
  })
}

app.listen(port, async () => {
  const logMessages = [
    `API running at http://localhost:${port}/api/companies`,
    `OpenAPI docs running at http://localhost:${port}/api`,
  ]

  if (START_BOARD) {
    const discord = (await import('./discord')).default
    await discord.login()
    logMessages.push(
      `See the UI for the Garbo pipeline at http://localhost:${port}/admin/queues`
    )
  }

  console.log(logMessages.join('\n'))
})

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

  console.log(`Found ${orphanedMetadata.length} orphaned metadata records.`)

  if (orphanedMetadata.length > 0) {
    const deleted = await prisma.metadata.deleteMany({
      where: {
        id: { in: orphanedMetadata.map((m) => m.id) },
      },
    })

    console.log(`Deleted ${deleted.count} orphaned metadata records.`)
  }
}

setInterval(() => {
  findAndDeleteOrphanedMetadata()
}, 1000 * 60 * 60 * 24)
