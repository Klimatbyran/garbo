import { PipelineWorker } from '../lib/PipelineWorker'
import { FlowProducer } from 'bullmq'
import redis from '../config/redis'
import precheck from './precheck'
import { vectorDB } from '../lib/vectordb'
import { QUEUE_NAMES } from '../queues'
import { withPipelineJobOpts } from '../lib/pipelineJobOptions'

const flow = new FlowProducer({ connection: redis })
flow.on('error', (err) => console.error('FlowProducer connection error:', err))

const parsePdf = new PipelineWorker(
  QUEUE_NAMES.PARSE_PDF,
  async (job) => {
    const { url, forceReindex, callbackUrl } = job.data as {
      url: string
      forceReindex?: boolean
      // When set, run Docling only — no indexMarkdown/Chroma, no precheck.
      // doclingParsePDF POSTs {url, markdown} here once parsing completes,
      // for callers (e.g. a separate document pipeline) that want the raw
      // markdown directly. Must match an entry in ALLOWED_CALLBACK_URLS.
      callbackUrl?: string
    }
    job.log(`forceReindex flag: ${Boolean(forceReindex)}`)
    job.log(`callbackUrl: ${callbackUrl ?? '(none)'}`)
    job.opts.attempts = 1

    const name = url.slice(-20)
    const base = {
      data: {
        ...job.data,
      },
      opts: withPipelineJobOpts({
        attempts: 3,
      }),
    }

    job.log(`Docling pipeline starting for url: ${url}`)

    try {
      if (callbackUrl) {
        // climate plans pipeline path — always re-parse and hand markdown
        // straight to callbackUrl (fired from doclingParsePDF once it has the
        // result), skipping indexMarkdown/Chroma and precheck entirely.
        // vectorDB.hasReport() below only reflects the *other* flow's Chroma
        // index, so it doesn't tell us anything useful here.
        job.editMessage(
          `✅ PDF queued. Parsing via Docling (climate plans pipeline)...`
        )

        const doclingFlow = await flow.add({
          ...base,
          name: 'doclingParsePDF',
          queueName: QUEUE_NAMES.DOCLING_PARSE_PDF,
          opts: withPipelineJobOpts({
            attempts: 3,
            backoff: { type: 'fixed', delay: 120_000 },
          }),
        })
        job.log('docling-only flow started: ' + doclingFlow.job?.id)
        return { url, callbackUrl }
      }

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
                  opts: withPipelineJobOpts({
                    attempts: 3,
                    backoff: { type: 'fixed', delay: 120_000 },
                  }),
                },
              ],
            },
          ],
        })
        job.log('flow started: ' + precheckFlow.job?.id)
      } else {
        job.editMessage(`✅ PDF already interpreted and indexed. Continuing...`)

        const markdown = await vectorDB.getRelevantMarkdown(url, [
          'company name, annual report, about the company, introduction, company overview, who we are, our business, bolagets namn, årsredovisning, om bolaget',
        ])

        const added = await precheck.queue.add(
          'precheck',
          {
            ...job.data,
            cachedMarkdown: markdown,
          },
          withPipelineJobOpts()
        )
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
