import { DiscordWorker } from '../lib/DiscordWorker'
import { FlowProducer } from 'bullmq'
import redis from '../config/redis'
import precheck from './precheck'
import { vectorDB } from '../lib/vectordb'
import { QUEUE_NAMES } from '../queues'

const flow = new FlowProducer({ connection: redis })

const parsePdf = new DiscordWorker(
  QUEUE_NAMES.PARSE_PDF,
  async (job) => {
    const { url, forceReindex } = job.data as {
      url: string
      forceReindex?: boolean
    }
    job.log(`forceReindex flag: ${Boolean(forceReindex)}`)
    job.opts.attempts = 1

    const name = url.slice(-20)
    const base = {
      data: {
        ...job.data,
      },
    }

    job.log(`Docling pipeline starting for url: ${url}`)

    try {
      const exists = await vectorDB.hasReport(url)
      job.log(`vector index exists for url: ${exists}`)

      // If forcing reindex, delete existing indexed report to ensure a fresh run
      if (forceReindex) {
        try {
          job.log(
            'forceReindex enabled: deleting existing vector index (if any)'
          )
          await vectorDB.deleteReport(url)
          job.log('deleteReport completed')
        } catch (_) {
          // ignore delete errors; proceed to rebuild
          job.log('deleteReport threw, ignoring and proceeding to rebuild')
        }
      }

      if (!exists || forceReindex) {
        job.editMessage(`✅ PDF queued. Parsing via Docling and indexing...`)

        const precheckFlow = await flow.add({
          ...base,
          name: 'precheck ' + name,
          queueName: QUEUE_NAMES.PRECHECK,
          children: [
            {
              ...base,
              name: 'indexMarkdown ' + name,
              queueName: QUEUE_NAMES.INDEX_MARKDOWN,
              children: [
                {
                  ...base,
                  name: 'doclingParsePDF',
                  queueName: QUEUE_NAMES.DOCLING_PARSE_PDF,
                },
              ],
            },
          ],
        })
        job.log('flow started: ' + precheckFlow.job?.id)
      } else {
        job.editMessage(`✅ PDF already interpreted and indexed. Continuing...`)

        const markdown = await vectorDB.getRelevantMarkdown(url, [
          'GHG accounting, tCO2e (location-based method), ton CO2e, scope, scope 1, scope 2, scope 3, co2, emissions, emissions, 2021, 2023, 2022, gri protocol, CO2, ghg, greenhouse, gas, climate, change, global, warming, carbon, växthusgaser, utsläpp, basår, koldioxidutsläpp, koldioxid, klimatmål',
        ])

        const added = await precheck.queue.add('precheck', {
          ...job.data,
          cachedMarkdown: markdown,
        })
        return added.id
      }
      return true
    } catch (error) {
      job.editMessage(`❌ Error starting Docling pipeline: ${error.message}`)
      throw new Error(error)
    }
  },
  { concurrency: 1, connection: redis, lockDuration: 5 * 60 * 1000 }
)

export default parsePdf
