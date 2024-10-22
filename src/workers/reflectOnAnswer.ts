import prompt from '../prompts/reflect'
import discord from '../discord'
import { askStream } from '../openai'
import { discordReview } from '../queues'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'

class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    paragraphs: string[]
    answer: string
    previousPrompt: string
    previousAnswer: string
  }
}

const worker = new DiscordWorker('reflectOnAnswer', async (job: JobData) => {
  await job.sendMessage(`🤖 Reflekterar... ${job.attemptsStarted || ''}`)

  // {
  //  "jobId1": { "turnover": { ... } },
  //  "jobId2": { "emissions": { ... } }
  // }

  const values = job.data.childrenValues

  // {
  //   "industry": { ...},
  //   "scope12": { ... },
  //   "scope3": { ... },
  //   "goals": { ... },
  // }

  // TODO: save each answer to db.

  job.log(`Reflecting on: 
--- Context:
childrenValues: ${JSON.stringify(values, null, 2)}
--- Prompt:
${prompt}`)

  const response = await askStream(
    [
      {
        role: 'system',
        content:
          'You are an expert in CSRD reporting. Be accurate and follow the instructions carefully.',
      },
      {
        role: 'user',
        content: 'These are the results from the previous CSRD agents:',
      },
      {
        role: 'user',
        content: (values && JSON.stringify(values)) || null,
      },
      { role: 'user', content: prompt },
      Array.isArray(job.stacktrace)
        ? [
            { role: 'assistant', content: job.data.previousAnswer },
            { role: 'user', content: job.stacktrace.join('\n') },
          ]
        : undefined,
      { role: 'user', content: 'Reply only with JSON' },
    ]
      .flat()
      .filter((m) => m?.content) as any[],
    {
      onParagraph: () => {
        discord.sendTyping(job.data)
      },
    }
  )

  let parsedJson
  try {
    job.log('Parsing JSON: \n\n' + response)
    const jsonMatch = response.match(/```json([\s\S]*?)```/)
    const json = jsonMatch ? jsonMatch[1].trim() : response
    parsedJson = JSON.parse(json)
  } catch (error) {
    job.updateData({
      ...job.data,
      previousAnswer: response,
    })
    job.sendMessage(`❌ ${error.message}:`)
    throw error
  }
  const companyName = parsedJson.companyName

  job.editMessage(`✅ ${companyName} klar`)

  job.log(`Final JSON: 
${JSON.stringify(parsedJson, null, 2)}`)
  discordReview.add(companyName, {
    ...job.data,
    url: job.data.url || parsedJson.url,
    json: JSON.stringify(parsedJson, null, 2),
  })

  return JSON.stringify(parsedJson, null, 2)
})

export default worker
