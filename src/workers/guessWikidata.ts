import { UnrecoverableError } from 'bullmq'
import { searchCompany } from '../lib/wikidata'
import { ask } from '../lib/openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import wikidata from '../prompts/wikidata'

class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
  }
}

const guessWikidata = new DiscordWorker<JobData>(
  'guessWikidata',
  async (job: JobData) => {
    const { companyName } = job.data
    if (!companyName) throw new Error('No company name was provided')

    job.log('Searching for company name: ' + companyName)
    const results = await searchCompany({ companyName })
    job.log('Results: ' + JSON.stringify(results, null, 2))
    if (results.length === 0) {
      await job.sendMessage(`❌ Hittade inte Wikidata för: ${companyName}.`)
      // TODO: If no wikidata entry was found, provide a link to create a new wikidata entry.
      // TODO: allow providing the wikidata entry if it is known, to continue the job.
      throw new UnrecoverableError(`No Wikidata entry for "${companyName}"`)
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
      ].filter((m) => m.content?.length > 0) as any[],
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
    return JSON.stringify(parsedJson, null, 2)
  }
)

export default guessWikidata
