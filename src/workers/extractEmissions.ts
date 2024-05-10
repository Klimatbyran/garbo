import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import OpenAI from 'openai'
import prompt from '../prompts/parsePDF'
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

const worker = new Worker(
  'extractEmissions',
  async (job: JobData) => {
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

    const markdown = response.match(/```markdown(.|\n)*```/)[0]
    if (markdown) discord.sendMessage(job.data, markdown)

    reflectOnAnswer.add(
      'reflect on answer ' + response.slice(0, 20),
      {
        ...job.data,
        answer: response,
        paragraphs: pdfParagraphs,
      },
      {
        attempts: 3,
      }
    )

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
