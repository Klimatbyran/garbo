import { Worker, Job, FlowProducer } from 'bullmq'
import redis from '../config/redis'
import OpenAI from 'openai'
import prompt from '../prompts/parsePDF'
import reflectPrompt from '../prompts/reflect'
import { reflectOnAnswer } from '../queues'
import config from '../config/openai'
import discord from '../discord'

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
      model: 'gpt-4-turbo',
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

    // NOT DONE: Add a flow with children
    await flow.add({
      name: 'reflections',
      queueName: 'reflectOnAnswer',
      data: job.data,
      children: [
        {
          name: 'industry',
          data: {
            ...job.data,
            prompt:
              'Extract industry, sector, industry group, according to GICS. Add it as field "industry", "sector", "industryGroup" in the JSON.',
          },
          queueName: 'followUp',
        },
        {
          name: 'scope1+2',
          data: {
            ...job.data,
            prompt:
              'Extract scope 1 and 2 emissions according to the GHG protocol. Add it as field emissions: [{year: 2021, "scope1": {}, "scope2": {}}] in the JSON.',
          },
          queueName: 'followUp',
        },
        {
          name: 'scope3',
          data: {
            ...job.data,
            prompt:
              'Extract scope 3 emissions according to the GHG protocol. Add it as field emissions: [{year: 2021, "scope3": {}}] in the JSON.',
          },
          queueName: 'followUp',
        },
      ],
      opts: {
        parent: {
          id: job.id,
          queue: job.queueQualifiedName,
        },
      },
    })

    const reflect = await reflectOnAnswer.add(
      'reflect on answer ' + response.slice(0, 20),
      {
        ...job.data,
        answer: response,
        paragraphs: pdfParagraphs,
        prompt: reflectPrompt,
      },
      {
        attempts: 3,
      }
    )

    reflect.moveToWaitingChildren(token)

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
