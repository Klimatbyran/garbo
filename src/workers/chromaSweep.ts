import { Worker } from 'bullmq'
import redis from '../config/redis'
import chromaConfig from '../config/chromadb'
import { vectorDB } from '../lib/vectordb'
import { getSharedQueue } from '../lib/getSharedQueue'
import { purgeLegacyBullmqRepeatables } from '../lib/purgeLegacyBullmqRepeatables'
import { CHROMA_SWEEP_QUEUE } from '../queueNames'

// Deletes Chroma chunks older than CHROMA_TTL_HOURS so the Chroma disk can't
// fill up. Searches that miss rebuild the report from Report.markdown
// (see lib/chromaRetention.ts), so reruns still work after a sweep.

const REPEAT_EVERY_MS = 60 * 60 * 1000
const TICK_NAME = 'sweep'

// Not withPipelineJobOpts(): that keeps completed jobs forever (pipeline-api
// prunes by run, and sweeps belong to no run), so cap them here.
const SWEEP_JOB_RETENTION = {
  removeOnComplete: { count: 24 },
  removeOnFail: { count: 50 },
}

const queue = getSharedQueue(CHROMA_SWEEP_QUEUE, SWEEP_JOB_RETENTION)

const worker = new Worker(
  CHROMA_SWEEP_QUEUE,
  async (job) => {
    const { ttlHours } = chromaConfig
    if (ttlHours <= 0) {
      job.log('CHROMA_TTL_HOURS is 0; sweep disabled')
      return { skipped: true }
    }
    job.log(`Deleting Chroma chunks indexed more than ${ttlHours}h ago`)
    await vectorDB.deleteStaleChunks(ttlHours)
    job.log('Chroma sweep done')
    return { ttlHours }
  },
  { connection: redis, concurrency: 1, lockDuration: 10 * 60 * 1000 }
)

worker.on('failed', (job, err) => {
  console.error(
    `[chromaSweep] sweep failed job=${job?.id}:`,
    err?.message ?? err
  )
})

worker.on('error', (err) => {
  console.error('[chromaSweep] worker error:', err?.message ?? err)
})

const SWEEP_SCHEDULER_ID = 'chroma-sweep'

async function ensureRepeatableSweep() {
  try {
    const purged = await purgeLegacyBullmqRepeatables(CHROMA_SWEEP_QUEUE)
    if (purged > 0) {
      console.log(
        `[chromaSweep] purged ${purged} legacy BullMQ v5 repeatable key(s)`
      )
    }

    for (const scheduler of await queue.getJobSchedulers()) {
      if (scheduler.name === TICK_NAME) {
        await queue.removeJobScheduler(scheduler.key)
      }
    }

    if (chromaConfig.ttlHours <= 0) {
      console.log('[chromaSweep] CHROMA_TTL_HOURS is 0; sweep not scheduled')
      return
    }
    await queue.upsertJobScheduler(
      SWEEP_SCHEDULER_ID,
      { every: REPEAT_EVERY_MS },
      {
        name: TICK_NAME,
        data: {},
        opts: { ...SWEEP_JOB_RETENTION },
      }
    )
    console.log(
      `[chromaSweep] job scheduler every ${REPEAT_EVERY_MS}ms registered (ttl ${chromaConfig.ttlHours}h)`
    )
  } catch (err) {
    console.error('[chromaSweep] failed to register repeatable sweep:', err)
  }
}

void ensureRepeatableSweep()

export default worker
