import 'dotenv/config'
import { Queue } from 'bullmq'
import { parseArgs } from 'node:util'
import redis from '../src/config/redis'
import { QUEUE_NAMES } from '../src/queues'

const {
  values: {
    'completed-hours': completedHours,
    'failed-days': failedDays,
    limit,
  },
} = parseArgs({
  options: {
    'completed-hours': {
      type: 'string',
      default: '24',
    },
    'failed-days': {
      type: 'string',
      default: '7',
    },
    limit: {
      type: 'string',
      default: '1000',
    },
  },
})

const completedGraceMs = Math.max(1, Number(completedHours)) * 60 * 60 * 1000
const failedGraceMs = Math.max(1, Number(failedDays)) * 24 * 60 * 60 * 1000
const cleanLimit = Math.max(1, Number(limit))

async function cleanQueue(queueName: string) {
  const queue = new Queue(queueName, { connection: redis })

  try {
    const cleanedCompleted = await queue.clean(
      completedGraceMs,
      cleanLimit,
      'completed'
    )
    const cleanedFailed = await queue.clean(failedGraceMs, cleanLimit, 'failed')

    console.log(
      `[${queueName}] cleaned completed=${cleanedCompleted.length}, failed=${cleanedFailed.length}`
    )
  } finally {
    await queue.close()
  }
}

async function main() {
  const queueNames = [...new Set(Object.values(QUEUE_NAMES))]

  for (const queueName of queueNames) {
    await cleanQueue(queueName)
  }

  console.log('BullMQ cleanup completed')
}

main().catch((error) => {
  console.error('BullMQ cleanup failed:', error)
  process.exitCode = 1
})
