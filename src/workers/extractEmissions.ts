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
import turnover from '../prompts/followUp/turnover'
import factors from '../prompts/followUp/factors'
import publicComment from '../prompts/followUp/publicComment'
import fiscalYear from '../prompts/followUp/fiscalYear'

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

    const stream = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are an expert in CSRD reporting. Be consise and accurate.',
        },
        { role: 'user', content: prompt },
        { role: 'assistant', content: 'Sure! Just send me the PDF data?' },
        { role: 'user', content: pdfParagraphs.join('\n\n') },
      ],
      model: 'gpt-4o',
      stream: true,
    })
    let response = ''
    let progress = 0
    for await (const part of stream) {
      response += part.choices[0]?.delta?.content || ''
      job.updateProgress(Math.min(1, progress / 400))
    }

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
          name: 'turnover',
          data: { ...base.data, prompt: turnover },
        },
        {
          ...base,
          name: 'fiscalYear',
          data: {
            ...base.data,
            prompt: fiscalYear,
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'key upstream emission factors',
          data: { ...base.data, prompt: factors },
          queueName: 'followUp',
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

    //chain.job.moveToWaitingChildren(token)

    // Do something with job
    return response
  },
  {
    concurrency: 10,
    connection: redis,
    autorun: false,
  }
)

export default worker
