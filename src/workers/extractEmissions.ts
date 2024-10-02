import { Worker, Job, FlowProducer } from 'bullmq'
import redis from '../config/redis'
import prompt from '../prompts/parsePDF'
import discord from '../discord'
import companyNamePrompt from '../prompts/followUp/companyName'
import industryNace from '../prompts/followUp/industry_nace'
import industryGics from '../prompts/followUp/industry_gics'
import scope12 from '../prompts/followUp/scope12'
import scope3 from '../prompts/followUp/scope3'
import * as goals from '../prompts/followUp/goals'
import initiatives from '../prompts/followUp/initiatives'
import contacts from '../prompts/followUp/contacts'
import baseFacts from '../prompts/followUp/baseFacts'
import publicComment from '../prompts/followUp/publicComment'
import fiscalYear from '../prompts/followUp/fiscalYear'
import factors from '../prompts/followUp/factors'
import { ask } from '../openai'
import { zodResponseFormat } from 'openai/helpers/zod'

class JobData extends Job {
  declare data: {
    url: string
    paragraphs: string[]
    companyName: string
    wikidataId: string
    threadId: string
    pdfHash: string
  }
}

const flow = new FlowProducer({ connection: redis })

const worker = new Worker(
  'extractEmissions',
  async (job: JobData, token: string) => {
    const { paragraphs, companyName, wikidataId } = job.data
    job.log(`Asking AI for following context and prompt: ${paragraphs.join(
      '\n\n'
    )}
    ${prompt}`)

    const message = await discord.sendMessage(
      job.data,
      `🤖 Hämtar utsläppsdata...`
    )

    const response = await ask([
      {
        role: 'system',
        content:
          'You are an expert in CSRD reporting. Be consise and accurate.',
      },
      { role: 'user', content: prompt },
      { role: 'assistant', content: 'Sure! Just send me the PDF data?' },
      { role: 'user', content: paragraphs.join('---PDF EXTRACT---\n\n') },
    ])
    job.log(response)

    message.edit('✅ Utsläppsdata hämtad')
    const markdown = response
      .match(/```markdown(.|\n)*```/)?.[0]
      .replace('```markdown', '```')

    discord.sendMessage(job.data, '✅ Fått preliminära siffror')

    const base = {
      name: companyName,
      data: {
        wikidataId,
        threadId: job.data.threadId,
        url: job.data.url,
        answer: response,
      },
      queueName: 'followUp',
      opts: {
        attempts: 3,
      },
    }

    await flow.add({
      name: companyName,
      queueName: 'reflectOnAnswer',
      data: { ...job.data, answer: response },
      children: [
        {
          ...base,
          name: 'industryGics ' + companyName,
          data: {
            ...base.data,
            apiSubEndpoint: 'industry',
            prompt: industryGics,
          },
        },
        // TODO: Decide if we should store NACE codes. If so, we need to update the DB and API.
        // {
        //   ...base,
        //   name: 'industryNace ' + companyName,
        //   data: {
        //     ...base.data,
        //     apiSubEndpoint: 'industry',
        //     prompt: industryNace,
        //   },
        // },
        {
          ...base,
          name: 'scope1+2 ' + companyName,
          data: { ...base.data, apiSubEndpoint: 'emissions', prompt: scope12 },
        },
        {
          ...base,
          name: 'scope3 ' + companyName,
          data: { ...base.data, apiSubEndpoint: 'emissions', prompt: scope3 },
        },
        {
          ...base,
          name: 'goals ' + companyName,
          data: {
            ...base.data,
            apiSubEndpoint: 'goals',
            prompt: goals.prompt,
            schema: zodResponseFormat(goals.schema, 'goals'),
          },
        },
        {
          ...base,
          name: 'initiatives ' + companyName,
          data: {
            ...base.data,
            apiSubEndpoint: 'initiatives',
            prompt: initiatives,
          },
        },
        {
          ...base,
          name: 'sustainability contacts ' + companyName,
          data: { ...base.data, prompt: contacts },
        },*/
        {
          ...base,
          name: 'baseFacts ' + companyName,
          data: { ...base.data, apiSubEndpoint: 'economy', prompt: baseFacts },
        },
        {
          ...base,
          name: 'fiscalYear ' + companyName,
          data: { ...base.data, apiSubEndpoint: 'economy', prompt: fiscalYear },
        },
        /*{
          ...base,
          name: 'key upstream emission factors for ' + companyName,
          data: { ...base.data, prompt: factors },
        },
        {
          ...base,
          name: 'publicComment ' + companyName,
          data: { ...base.data, prompt: publicComment },
        },

        {
          ...base,
          data: { ...base.data, companyName, url: job.data.url },
          queueName: 'includeFacit',
        },*/
      ],
      opts: {
        attempts: 3,
      },
    })

    discord.sendMessage(job.data, `🤖 Ställer följdfrågor...`)

    //chain.job.moveToWaitingChildren(token)

    // Do something with job
    return response
  },
  {
    concurrency: 10,
    connection: redis,
  }
)

export default worker
