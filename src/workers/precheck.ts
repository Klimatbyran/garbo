import { FlowProducer } from 'bullmq'
import redis from '../config/redis'
import wikidata from '../prompts/wikidata'
import fiscalYear from '../prompts/fiscalYear'
import { askPrompt } from '../lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'

class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    cachedMarkdown?: string
    companyName?: string
  }
}

const flow = new FlowProducer({ connection: redis })

const precheck = new DiscordWorker('precheck', async (job: JobData) => {
  const { cachedMarkdown, ...baseData } = job.data
  const { markdown = cachedMarkdown } = await job.getChildrenEntries()

  const companyName = await askPrompt(
    'What is the name of the company? Respond only with the company name. We will search Wikidata for this name. The following is an extract from a PDF:',
    markdown.substring(0, 5000)
  )

  job.log('Company name: ' + companyName)

  await job.setThreadName(companyName)

  const description = await askPrompt(
    `Give a short description of the company. Respond only with the company description text.
** Description **
Beskrivning av företaget. Tänk på att vara så informativ som möjligt. Den här texten ska visas på en sida
för hållbarhetsredovisning så det är viktigt att den är informativ och beskriver företaget väl men inte tillåter
texter som kan uppfattas som greenwashing eller marknadsföring. Många företag är okända för allmänheten så det
är viktigt att beskrivningen är informativ och beskriver företaget väl.
*** LANGUAGE: ONLY WRITE THE DESCRIPTION IN SWEDISH! If the original texts are written in English, translate to Swedish ***
The following is an extract from a PDF:`,
    markdown.substring(0, 5000)
  )

  const base = {
    queueName: 'followUp',
    data: { ...baseData, companyName, description },
    opts: {
      attempts: 3,
    },
  }

  job.sendMessage(`🤖 Ställer frågor om basfakta...`)

  await flow.add({
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
          schema: zodResponseFormat(wikidata.schema, 'wikidata'),
        },
      },
      {
        ...base,
        name: 'fiscalYear ' + companyName,
        data: {
          ...base.data,
          prompt: fiscalYear.prompt,
          schema: zodResponseFormat(fiscalYear.schema, 'fiscalYear'),
        },
      },
    ],
    opts: {
      attempts: 3,
    },
  })
})

export default precheck
