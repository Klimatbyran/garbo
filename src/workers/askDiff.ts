import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { ask } from '../lib/openai'
import { vectorDB } from '../lib/vectordb'

class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: any
    url: string
  }
}

const askDiff = new DiscordWorker<JobData>(
  'askDiff',
  async (job) => {
    const { url } = job.data

    const markdown = await vectorDB.getRelevantMarkdown(url, [
      'change',
      'changed',
      'difference',
      'compared',
      'previous',
      'year',
      'förändring',
      'skillnad',
      'jämfört',
      'föregående',
      'år',
    ])

    const response = await ask(
      [
        {
          role: 'system',
          content:
            'Du är en expert på hållbarhetsrapportering som ska analysera förändringar i utsläpp mellan åren.',
        },
        {
          role: 'user',
          content: `Analysera följande text och beskriv kortfattat de viktigaste förändringarna i utsläpp mellan åren. Fokusera på scope 1, 2 och 3. Svara på svenska.

${markdown}`,
        },
      ],
      {
        temperature: 0,
      }
    )

    await job.sendMessage(`📊 Analys av förändringar:\n${response}`)

    return response
  }
)

export default askDiff
