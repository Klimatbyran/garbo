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

    message?.edit('✅ Utsläppsdata hämtad')
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
            // Not sure why we named it "emissions_scope12" - maybe to avoid overwriting the result of the other job?
            // Need to make sure it can easily be saved to the API, which expects "emissions" as the key.
            schema: zodResponseFormat(scope12.schema, 'emissions_scope12'),
          },
        },
        // {
        //   ...base,
        //   name: 'scope3 ' + companyName,
        //   data: {
        //     ...base.data,
        //     apiSubEndpoint: 'emissions',
        //     prompt: scope3.prompt,
        //     schema: zodResponseFormat(scope3.schema, 'emissions_scope3'),
        //   },
        // },
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
        {
          ...base,
          name: 'publicComment ' + companyName,
          data: { 
            ...base.data, 
            prompt: publicComment.prompt, 
            schema: zodResponseFormat(publicComment.schema, 'publicComment') 
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
