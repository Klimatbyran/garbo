import { FlowProducer } from 'bullmq'
import redis from '../config/redis'
import wikidata from '../prompts/wikidata'
import { askPrompt, askStream } from '../lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { JobType } from '../types'
import { z } from 'zod'
import { QUEUE_NAMES } from '../queues'
import discord from '../discord'

class PrecheckJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    cachedMarkdown?: string
    companyName?: string
    type: JobType
    waitingForCompanyName?: boolean
  }
}

const flow = new FlowProducer({ connection: redis })

const companyNameSchema = z.object({
  companyName: z.string().nullable(),
})

const precheck = new DiscordWorker(
  QUEUE_NAMES.PRECHECK, 
  async (job: PrecheckJob) => {
    const { cachedMarkdown, type, waitingForCompanyName, companyName: existingCompanyName, ...baseData } = job.data
    const { markdown = cachedMarkdown } = await job.getChildrenEntries()

    // If we already have a company name provided by the user, use it directly
    if (existingCompanyName && waitingForCompanyName) {
      job.log('Using manually provided company name: ' + existingCompanyName)
      await job.updateData({ ...job.data, waitingForCompanyName: false })
      return processWithCompanyName(existingCompanyName)
    }

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
    
    if (!companyName) {
      // If we're already waiting for manual input, don't send another message
      if (waitingForCompanyName) {
        job.log('Still waiting for user to provide company name manually...')
        await job.moveToDelayed(Date.now() + 30000) // Check again in 30 seconds
        return
      }

      // Send message asking for manual input
      job.log('Could not find company name, asking user for input')
      const buttonRow = discord.createEditCompanyNameButtonRow(job)
      
      await job.sendMessage({
        content: "❌ Could not automatically find the company's name in the document. Please enter the company name manually:",
        components: [buttonRow],
      })
      
      // Mark the job as waiting for company name
      await job.updateData({ ...job.data, waitingForCompanyName: true })
      await job.moveToDelayed(Date.now() + 300000) // Check again in 5 minutes
      return
    }
    
    return processWithCompanyName(companyName)

    async function processWithCompanyName(companyName: string) {
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
        
      job.sendMessage('🤖 Asking questions about basic facts...')
        
      try {
        const extractEmissions = await flow.add({
          name: 'precheck done ' + companyName,
          queueName: QUEUE_NAMES.EXTRACT_EMISSIONS,
          data: { ...base.data },
          children: [
            {
              ...base,
              name: 'guessWikidata ' + companyName,
              queueName: QUEUE_NAMES.GUESS_WIKIDATA,
              data: {
                ...base.data,
                schema: zodResponseFormat(wikidata.schema, type),
              },
            },
            {
              ...base,
              queueName: QUEUE_NAMES.FOLLOW_UP,
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
  }
)
    
export default precheck
