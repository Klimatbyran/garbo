import { FlowProducer } from 'bullmq'
import redis from '../config/redis'
import wikidata from '../prompts/wikidata'
import { askPrompt, askStream } from '../lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { JobType } from '../types'
import { z } from 'zod'
import { QUEUE_NAMES } from '../queues'

class PrecheckJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    cachedMarkdown?: string
    companyName?: string
    type: JobType
  }
}

const flow = new FlowProducer({ connection: redis })

const companyNameSchema = z.object({
  companyName: z.string().nullable(),
})

const precheck = new DiscordWorker(
  QUEUE_NAMES.PRECHECK, 
  async (job: PrecheckJob) => {
    const { cachedMarkdown, type, ...baseData } = job.data
    const { markdown = cachedMarkdown } = await job.getChildrenEntries()
  
    async function extractCompanyName(
      markdown: string,
      retry = 3,
      start = 0,
      chunkSize = 5000
    ): Promise<string | null> {
      if (retry <= 0 || start >= markdown.length) return null
      const chunk = markdown.substring(start, start + chunkSize)
      const response = await askStream(
        [
          {
            role: 'user',
            content: `What is the name of the company? Respond only with the company name, leave null if you cannot find it. We will search Wikidata for this name. The following is an extract from a PDF:
            
            ${chunk}
            `,
          },
        ],
        {
          response_format: zodResponseFormat(
            companyNameSchema,
            `companyName-${retry}`
          ),
        }
      ).then(JSON.parse)
  
      const { companyName: rawName } = companyNameSchema.parse(response)
      const companyName = rawName ? rawName.trim() : null
  
      return (
        companyName ||
        extractCompanyName(markdown, retry - 1, start + chunkSize, chunkSize)
      )
    }
  
    const companyName = await extractCompanyName(markdown)
  
    if (!companyName) throw new Error('Could not find company name')
  
    job.log('Company name: ' + companyName)
    await job.setThreadName(companyName)
  
    const description = await askPrompt(
      `Du är en torr revisor som ska skriva en kort, objektiv beskrivning av företagets verksamhet.
  
  ** Beskrivning **
  Följ dessa riktlinjer:
  
  1. Längd: Beskrivningen får inte överstiga 300 tecken, inklusive mellanslag.
  2. Syfte: Endast företagets verksamhet ska beskrivas. Använd ett extra sakligt och neutralt språk.
  3. Förbjudet innehåll (marknadsföring): VIKTIGT! Undvik ord som "ledande", "i framkant", "marknadsledare", "innovativt", "värdefull", "framgångsrik" eller liknande. Texten får INTE innehålla formuleringar som uppfattas som marknadsföring eller säljande språk.
  4. Förbjudet innehåll (hållbarhet): VIKTIGT! Undvik ord som "hållbarhet", "klimat" eller liknande. Texten får INTE innehålla bedömningar av företagets hållbarhetsarbete.
  5. Språk: VIKTIGT! Beskrivningen ska ENDAST vara på svenska. Om originaltexten är på engelska, översätt till svenska.
  
  För att säkerställa att svaret följer riktlinjerna, tänk på att:
  
  - Använd ett sakligt och neutralt språk.
  - Aldrig använda marknadsförande eller värderande språk.
  - Tydligt beskriva företagets verksamhet.
  
  Svara endast med företagets beskrivning. Lägg inte till andra instruktioner eller kommentarer.
  
  Exempel på svar: "AAK är ett företag som specialiserar sig på växtbaserade oljelösningar. Företaget erbjuder ett brett utbud av produkter och tjänster inom livsmedelsindustrin, inklusive specialfetter för choklad och konfektyr, mejeriprodukter, bageri och andra livsmedelsapplikationer."
  
  Följande är ett utdrag ur en PDF:`,
      markdown.substring(0, 5000)
    )
  
    const base = {
      data: { ...baseData, companyName, description },
      opts: {
        attempts: 3,
      },
    }
  
    job.log('Company description:\n' + description)
  
    job.sendMessage('🤖 Ställer frågor om basfakta...')
  
    try {
      const extractEmissions = await flow.add({
        name: 'precheck done ' + companyName,
        queueName: 'extractEmissions', // this is where the result from the children will be sent
        data: { ...base.data },
        children: [
          {
            ...base,
            name: 'guessWikidata ' + companyName,
            queueName: 'guessWikidata',
            data: {
              ...base.data,
              schema: zodResponseFormat(wikidata.schema, type),
            },
          },
          {
            ...base,
            queueName: 'followUp',
            name: 'fiscalYear ' + companyName,
            data: {
              ...base.data,
              type: JobType.FiscalYear,
            },
          },
        ],
        opts: {
          attempts: 3,
        },
      })
      return extractEmissions.job?.id
    } catch (error) {
      job.log('Error: ' + error)
      job.editMessage('❌ Error: ' + error)
      throw error
    }
  }
)

export default precheck
