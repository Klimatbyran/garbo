import { searchCompany } from '../lib/wikidata'
import { ask } from '../lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import wikidata from '../prompts/wikidata'
import { SearchResult } from 'wikibase-sdk'

class GuessWikidataJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
  }
}

const guessWikidata = new DiscordWorker<GuessWikidataJob>(
  'guessWikidata',
  async (job: GuessWikidataJob) => {
    const { companyName } = job.data
    if (!companyName) throw new Error('No company name was provided')

    async function getWikidataSearchResults({
      companyName,
      retry = 0,
    }: {
      companyName: string
      retry?: number
    }): Promise<SearchResult[]> {
      if (retry > 3) return []

      job.log(`Searching for company name: ${companyName} (attempt ${retry})`)
      const results = await searchCompany({ companyName })

      job.log('Wikidata search results: ' + JSON.stringify(results, null, 2))

      if (results.length === 0) {
        // Retry without unwanted keywords, e.g. Telia Group -> Telia
        const name = companyName.split(' ').slice(0, -1).join(' ')
        return name
          ? getWikidataSearchResults({
              companyName: name,
              retry: retry + 1,
            })
          : []
      }

      return results
    }

    const results = await getWikidataSearchResults({ companyName })

    job.log('Results: ' + JSON.stringify(results, null, 2))
    if (results.length === 0) {
      await job.sendMessage(`❌ Hittade inte Wikidata för: ${companyName}.`)
      // TODO: If no wikidata entry was found, provide a link to create a new wikidata entry.
      // TODO: allow providing the wikidata entry if it is known, to continue the job.
      throw new Error(`No Wikidata entry for "${companyName}"`)
    }

    const response = await ask(
      [
        {
          role: 'system',
          content: `I have a company named ${companyName} and I am looking for the wikidata entry related to this company. Be helpful and try to be accurate.`,
        },
        { role: 'user', content: wikidata.prompt },
        {
          role: 'assistant',
          content: 'OK. Just send me the wikidata search results?',
        },
        {
          role: 'user',
          content: JSON.stringify(
            // NOTE: Exclude claims to reduce the number of input + output tokens since we are primarily interested in the wikidataId.
            // If we want to find other data like the company logo, we could filter the search results based on the wikidataId and extract the relevant property `PXXXXX` for the logo, which is probably standardised by wikidata
            results.map((e) => ({ ...e, claims: undefined })),
            null,
            2
          ),
        },
        Array.isArray(job.stacktrace)
          ? { role: 'user', content: job.stacktrace.join('\n') }
          : undefined,
      ].filter((m) => m && m.content?.length > 0) as any[],
      {
        response_format: zodResponseFormat(wikidata.schema, 'wikidata'),
      }
    )

    job.log('Response: ' + response)

    const parsedJson = JSON.parse(response)
    const wikidataId = parsedJson.wikidata?.node

    if (!wikidataId) {
      throw new Error(`Could not parse wikidataId from json: ${response}`)
    }

    job.sendMessage(
      `## Wikidata\nAccording to Garbo, the best match for ${companyName} was:\n\n\`\`\`json\n${JSON.stringify(
        parsedJson,
        null,
        2
      )}\`\`\``
    )
    return JSON.stringify(parsedJson, null, 2)
  }
)

export default guessWikidata
