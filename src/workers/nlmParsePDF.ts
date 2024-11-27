import { DiscordWorker } from '../lib/DiscordWorker'
import { FlowProducer, UnrecoverableError } from 'bullmq'
import { extractJsonFromPdf, fetchPdf } from '../lib/pdfTools'
import redis from '../config/redis'
import precheck from './precheck'
import { jsonToMarkdown } from '../lib/jsonExtraction'
import { vectorDB } from '../lib/vectordb'

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 10; SM-G996U Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36', //Garbo/1.0 (Linux; OpenAI 4;) Klimatkollen',
}

const flow = new FlowProducer({ connection: redis })

const nlmParsePDF = new DiscordWorker(
  'nlmParsePDF',
  async (job) => {
    const { url } = job.data

    job.log(`Downloading from url: ${url}`)
    try {
      const pdf = await fetchPdf(url, { headers })
      job.editMessage(
        `✅ PDF nedladdad. Tolkar PDF via nlm-ingestor. Tar upp till 3 minuter ☕️ ...`
      )

      const exists = await vectorDB.hasReport(url)

      if (!exists) {
        const before = Date.now()
        const interval = setInterval(async () => {
          const elapsed = Date.now() - before
          const remaining = Math.max(0, 180 - Math.floor(elapsed / 1000))
          if (remaining > 0) {
            await job.editMessage(
              `✅ PDF nedladdad. Tolkar PDF via nlm-ingestor. C:a ${remaining}s kvar ☕️ ...`
            )
            await job.sendTyping()
          } else {
            await job.editMessage('Nu borde det vara klart... 🤔')
          }
        }, 10000)
        let json
        try {
          json = await extractJsonFromPdf(pdf)
        } finally {
          clearInterval(interval)
        }
        const markdown = jsonToMarkdown(json)
        job.log('text found:\n' + markdown)
        job.updateData({
          ...job.data,
          json,
        })
        await job.editMessage(`✅ PDF tolkad`)

        const base = {
          data: {
            ...job.data,
            json,
          },
        }

        const name = url.slice(-20)
        await job.editMessage(`🤖 Tolkar tabeller...`)

        const precheck = await flow.add({
          ...base,
          data: {
            ...base.data,
            // Once the report has been parsed, we don't need the `json` repressentation of the report anymore.
            json: undefined,
          },
          name: 'precheck ' + name,
          queueName: 'precheck',
          children: [
            {
              ...base,
              name: 'indexMarkdown ' + name,
              queueName: 'indexMarkdown',
              children: [
                {
                  ...base,
                  name: 'extractTables ' + name,
                  queueName: 'nlmExtractTables',
                },
              ],
            },
          ],
        })
        job.log('flow started: ' + precheck.job?.id)
      } else {
        job.editMessage(`✅ PDF redan tolkad och indexerad. Fortsätter...`)

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
      job.editMessage(`❌ Fel vid nedladdning av PDF: ${error.message}`)
      throw new UnrecoverableError(`Download Failed: ${error.message}`)
    }
  },
  { concurrency: 1, connection: redis }
)

export default nlmParsePDF
