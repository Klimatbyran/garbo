import { Worker, Job, FlowProducer } from 'bullmq'
import redis from '../config/redis'
import prompt from '../prompts/parsePDF'
import discord from '../discord'
import industryGics from '../prompts/followUp/industry_gics'
import scope12 from '../prompts/followUp/scope12'
import scope3 from '../prompts/followUp/scope3'
import goals from '../prompts/followUp/goals'
import initiatives from '../prompts/followUp/initiatives'
import baseFacts from '../prompts/followUp/baseFacts'
import publicComment from '../prompts/followUp/publicComment'
import fiscalYear from '../prompts/followUp/fiscalYear'
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
  'precheck',
  async (job: JobData, token: string) => {
    const base = {
      data: {
        threadId: job.data.threadId,
        url: job.data.url,
      },
      queueName: 'followUp',
      opts: {
        attempts: 3,
      },
    }

    await flow.add({
      name: 'Precheck',
      queueName: 'extractEmissions', // this is where the result from the children will be sent
      data: { ...job.data },
      children: [
        {
          ...base,
          name: 'guesswikidata ',
          queueName: 'guessWikidata',
          data: {
            prompt: industryGics.prompt,
            schema: zodResponseFormat(industryGics.schema, 'industry'),
          },
        },
        {
          ...base,
          name: 'scope1+2 ' + companyName,
          data: {
            ...base.data,
            apiSubEndpoint: 'emissions',
            prompt: scope12.prompt,
            schema: zodResponseFormat(scope12.schema, 'emissions_scope12'),
          },
        },
        {
          ...base,
          name: 'scope3 ' + companyName,
          data: {
            ...base.data,
            apiSubEndpoint: 'emissions',
            prompt: scope3.prompt,
            schema: zodResponseFormat(scope3.schema, 'emissions_scope3'),
          },
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
            prompt: initiatives.prompt,
            schema: zodResponseFormat(initiatives.schema, 'initiatives'),
          },
        },
        // {
        //   ...base,
        //   name: 'sustainability contacts ' + companyName,
        //   data: {
        //     ...base.data,
        //     prompt: contacts.prompt,
        //     schema: zodResponseFormat(contacts.schema, 'contacts'),
        //   },
        // },
        {
          ...base,
          name: 'baseFacts ' + companyName,
          data: {
            ...base.data,
            apiSubEndpoint: 'economy',
            prompt: baseFacts.prompt,
            schema: zodResponseFormat(baseFacts.schema, 'baseFacts'),
          },
        },
        {
          ...base,
          name: 'fiscalYear ' + companyName,
          data: {
            ...base.data,
            apiSubEndpoint: 'economy',
            prompt: fiscalYear.prompt,
            schema: zodResponseFormat(fiscalYear.schema, 'fiscalYear'),
          },
        },
        /*{
          ...base,
          name: 'publicComment ' + companyName,
          data: {
            ...base.data,
            prompt: publicComment.prompt,
            schema: zodResponseFormat(publicComment.schema, 'publicComment'),
          },
        },*/
        // {
        //   ...base,
        //   data: { ...base.data, companyName, url: job.data.url },
        //   queueName: 'includeFacit',
        // },
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
