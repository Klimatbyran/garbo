import { PipelineWorker } from '../lib/PipelineWorker'
import { FlowProducer } from 'bullmq'
import redis from '../config/redis'
import precheck from './precheck'
import checkEmissionsPresence from './checkEmissionsPresence'
import { vectorDB } from '../lib/vectordb'
import { QUEUE_NAMES } from '../queues'
import { withPipelineJobOpts } from '../lib/pipelineJobOptions'
import { registryService } from '../api/services/registryService'

const flow = new FlowProducer({ connection: redis })
flow.on('error', (err) => console.error('FlowProducer connection error:', err))

function buildIndexMarkdownChild(
  base: {
    data: Record<string, unknown>
    opts: ReturnType<typeof withPipelineJobOpts>
  },
  name: string
) {
  return {
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
  }
}

async function findStoredReportMarkdown(jobData: {
  url: string
  sourceUrl?: string
  pdfCache?: { publicUrl?: string }
}): Promise<string | null> {
  const candidateUrls = [
    jobData.url,
    jobData.sourceUrl,
    jobData.pdfCache?.publicUrl,
  ].filter((value): value is string => Boolean(value))

  for (const candidateUrl of [...new Set(candidateUrls)]) {
    const markdown = await registryService.getMarkdownByUrl(candidateUrl)
    if (markdown?.trim()) return markdown
  }

  return null
}

const parsePdf = new PipelineWorker(
  QUEUE_NAMES.PARSE_PDF,
  async (job) => {
    const { url, forceReindex, callbackUrl, requireEmissionsPresence } =
      job.data as {
        url: string
        forceReindex?: boolean
        requireEmissionsPresence?: boolean
        sourceUrl?: string
        pdfCache?: { publicUrl?: string }
        // When set, run Docling only — no indexMarkdown/Chroma, no precheck.
        // doclingParsePDF POSTs {url, markdown} here once parsing completes,
        // for callers (e.g. a separate document pipeline) that want the raw
        // markdown directly. Must match an entry in ALLOWED_CALLBACK_URLS.
        callbackUrl?: string
      }
    job.log(`forceReindex flag: ${Boolean(forceReindex)}`)
    job.log(
      `requireEmissionsPresence flag: ${Boolean(requireEmissionsPresence)}`
    )
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

      const startFreshParseFlow = async (reason: string) => {
        job.log(`Starting Docling + index flow (${reason})`)
        job.editMessage(`✅ PDF queued. Parsing via Docling and indexing...`)

        const indexMarkdownChild = buildIndexMarkdownChild(base, name)

        if (requireEmissionsPresence) {
          // Gate is the flow parent so it can choose whether to enqueue
          // precheck — do not nest under precheck (FlowProducer parents
          // always run after children succeed).
          const gateFlow = await flow.add({
            ...base,
            name: 'checkEmissionsPresence ' + name,
            queueName: QUEUE_NAMES.CHECK_EMISSIONS_PRESENCE,
            children: [indexMarkdownChild],
          })
          job.log('emissions-gate flow started: ' + gateFlow.job?.id)
        } else {
          const precheckFlow = await flow.add({
            ...base,
            name: 'precheck ' + name,
            queueName: QUEUE_NAMES.PRECHECK,
            children: [indexMarkdownChild],
          })
          job.log('flow started: ' + precheckFlow.job?.id)
        }
      }

      if (!exists || forceReindex) {
        // Chroma miss (or force): prefer re-embedding Report.markdown over a
        // full Docling pass. forceReindex still means "re-parse the PDF".
        if (!forceReindex) {
          const storedMarkdown = await findStoredReportMarkdown(job.data)
          if (storedMarkdown) {
            job.log(
              `markdown cache hit (postgres): re-indexing ${storedMarkdown.length} chars into Chroma`
            )
            job.editMessage(
              `✅ PDF markdown found in registry. Re-indexing into Chroma...`
            )

            const indexMarkdownChild = {
              name: 'indexMarkdown ' + name,
              queueName: QUEUE_NAMES.INDEX_MARKDOWN,
              data: {
                ...job.data,
                markdown: storedMarkdown,
              },
              opts: withPipelineJobOpts({
                attempts: 3,
              }),
            }

            if (requireEmissionsPresence) {
              const gateFlow = await flow.add({
                ...base,
                name: 'checkEmissionsPresence ' + name,
                queueName: QUEUE_NAMES.CHECK_EMISSIONS_PRESENCE,
                children: [indexMarkdownChild],
              })
              job.log(
                'reindex-from-markdown emissions-gate flow started: ' +
                  gateFlow.job?.id
              )
            } else {
              const reindexFlow = await flow.add({
                ...base,
                name: 'precheck ' + name,
                queueName: QUEUE_NAMES.PRECHECK,
                children: [indexMarkdownChild],
              })
              job.log(
                'reindex-from-markdown flow started: ' + reindexFlow.job?.id
              )
            }
            return true
          }
          job.log('markdown cache miss (postgres); running Docling')
        }

        await startFreshParseFlow(
          forceReindex ? 'forceReindex' : 'no chroma index'
        )
      } else if (requireEmissionsPresence) {
        // Full markdown from registry — not the RAG company-name snippet.
        const fullMarkdown = await registryService.getMarkdownByUrl(url)
        if (!fullMarkdown || !fullMarkdown.trim()) {
          // Chroma can exist for legacy reports without Report.markdown.
          // Re-parse so the gate scans real text instead of falsely skipping.
          job.log(
            'requireEmissionsPresence: chroma hit but no registry markdown — re-parsing via Docling'
          )
          await startFreshParseFlow('cache hit without registry markdown')
        } else {
          job.editMessage(
            `✅ PDF already indexed. Checking for Scope 1/2/3 mentions...`
          )
          const added = await checkEmissionsPresence.queue.add(
            'checkEmissionsPresence',
            {
              ...job.data,
              markdown: fullMarkdown,
            },
            withPipelineJobOpts()
          )
          return added.id
        }
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
