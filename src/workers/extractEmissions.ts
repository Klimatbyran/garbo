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

const openai = new OpenAI(config)

class JobData extends Job {
  data: {
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

    const data = {
      threadId: job.data.threadId,
      url: job.data.url,
      answer: response,
    }

    await flow.add({
      name: 'reflections',
      queueName: 'reflectOnAnswer',
      data: { ...job.data, answer: response },
      children: [
        {
          name: 'companyName',
          data: {
            ...data,
            prompt: companyName,
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'industryGics',
          data: {
            ...data,
            prompt: industryGics,
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'industryNace',
          data: {
            ...data,
            prompt: industryNace,
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'scope1+2',
          data: {
            ...data,
            prompt: scope12,
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'scope3',
          data: {
            ...data,
            prompt: scope3,
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'goals',
          data: {
            ...data,
            prompt: goals,
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'sustainability initiatives',
          data: {
            ...data,
            prompt: initiatives,
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'sustainability contacts',
          data: {
            ...data,
            prompt: contacts,
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'turnover',
          data: {
            ...data,
            prompt: turnover,
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'key upstream emission factors',
          data: {
            ...data,
            prompt: factors,
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
        },
        {
          name: 'publicComment',
          data: {
            ...data,
            prompt: publicComment,
          },
          queueName: 'followUp',
          opts: {
            attempts: 3,
          },
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
