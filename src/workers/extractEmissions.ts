import { Worker, Job, FlowProducer } from 'bullmq'
import redis from '../config/redis'
import OpenAI from 'openai'
import prompt from '../prompts/parsePDF'
import config from '../config/openai'
import discord from '../discord'
import companyName from '../prompts/followUp/companyName'
import industryNace from '../prompts/followUp/industry_nace'
import industryGics from '../prompts/followUp/industry_gics'
import scope12 from '../prompts/followUp/scope12'
import scope3 from '../prompts/followUp/scope3'
import goals from '../prompts/followUp/goals'
import initiatives from '../prompts/followUp/initiatives'
import contacts from '../prompts/followUp/contacts'
import baseFacts from '../prompts/followUp/baseFacts'
import factors from '../prompts/followUp/factors'
import publicComment from '../prompts/followUp/publicComment'
import fiscalYear from '../prompts/followUp/fiscalYear'
import { ask, askPrompt, askStream } from '../openai'

const openai = new OpenAI(config)

class JobData extends Job {
  declare data: {
    url: string
    paragraphs: string[]
    threadId: string
    pdfHash: string
  }
}

const flow = new FlowProducer({ connection: redis })

const worker = new Worker(
  'extractEmissions',
  async (job: JobData, token: string) => {
    const pdfParagraphs = job.data.paragraphs
    job.log(`Asking AI for following context and prompt: ${pdfParagraphs.join(
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
      { role: 'user', content: pdfParagraphs.join('---PDF EXTRACT---\n\n') },
    ])
    job.log(response)

    message.edit('✅ Utsläppsdata hämtad')
    const markdown = response
      .match(/```markdown(.|\n)*```/)?.[0]
      .replace('```markdown', '```')
    if (markdown) discord.sendMessage(job.data, markdown.slice(0, 2000))
    else discord.sendMessage(job.data, response.slice(0, 2000))

    const base = {
      name: 'follow up',
      data: {
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
      name: 'reflections',
      queueName: 'reflectOnAnswer',
      data: { ...job.data, answer: response },
      children: [
        {
          ...base,
          name: 'companyName',
          data: { ...base.data, prompt: companyName },
        },
        {
          ...base,
          name: 'industryGics',
          data: { ...base.data, prompt: industryGics },
        },
        {
          ...base,
          name: 'industryNace',
          data: { ...base.data, prompt: industryNace },
        },
        {
          ...base,
          name: 'scope1+2',
          data: { ...base.data, prompt: scope12 },
        },
        {
          ...base,
          name: 'scope3',
          data: { ...base.data, prompt: scope3 },
        },
        {
          ...base,
          name: 'goals',
          data: { ...base.data, prompt: goals },
        },
        {
          ...base,
          name: 'initiatives',
          data: { ...base.data, prompt: initiatives },
        },
        {
          ...base,
          name: 'sustainability contacts',
          data: { ...base.data, prompt: contacts },
        },
        {
          ...base,
          name: 'baseFacts',
          data: { ...base.data, prompt: baseFacts },
        },
        {
          ...base,
          name: 'fiscalYear',
          data: { ...base.data, prompt: fiscalYear },
        },
        {
          ...base,
          name: 'key upstream emission factors',
          data: { ...base.data, prompt: factors },
        },
        {
          ...base,
          name: 'publicComment',
          data: { ...base.data, prompt: publicComment },
        },
        {
          ...base,
          data: { ...base.data, paragraphs: pdfParagraphs },
          name: 'guessWikidata',
          queueName: 'guessWikidata',
        },
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
