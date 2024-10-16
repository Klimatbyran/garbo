import wikidata from '../prompts/wikidata'
import fiscalYear from '../prompts/followUp/fiscalYear'
import { askPrompt } from '../openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { createCompany, fetchCompany, saveCompany } from '../lib/api'

class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    apiSubEndpoint: string
    companyName?: string
    wikidata: any
    fiscalYear: any
    childrenValues?: any
  }
}

const worker = new DiscordWorker('saveToAPI', async (job: JobData) => {
  const { apiSubEndpoint, companyName, url, wikidata, childrenValues } =
    job.data

  job.sendMessage(`🤖 sparar ${companyName}.${apiSubEndpoint} till API...`)
  job.log('Values: ' + JSON.stringify(job.data, null, 2))
  const wikidataId = wikidata.node
  const existingCompany = await fetchCompany(wikidataId).catch(() => null)

  const metadata = {
    source: url,
    comment: 'Parsed by Garbo AI',
  }

  if (existingCompany) {
    // IDEA: Use a diff helper to compare objects and generate markdown diff
    const diff = await askPrompt(
      'What is changed between these two json values? Please respond in clear text with markdown formatting. The purpose is to let an editor approve the changes or suggest changes in Discord.',
      JSON.stringify({
        before: existingCompany,
        after: childrenValues,
      })
    )
    job.log('Diff: ' + diff)
    job.sendMessage(`🤖 Diff: ${diff}`)
  } else {
    job.sendMessage(
      `🤖 Ingen tidigare data hittad för ${companyName} (${wikidataId}). Skapar...`
    )
    await createCompany({
      name: companyName,
      wikidataId,
      metadata,
    })
  }

  const values = Object.entries(childrenValues).map(
    ([apiSubEndpoint, value]) => {
      // TODO: save each answer to db.
      job.sendMessage(`🤖 Sparar ${apiSubEndpoint}...`)
      return saveCompany(wikidataId, apiSubEndpoint, {
        [apiSubEndpoint]: value,
        metadata,
      })
      // return values
    }
  )
  return values
})

export default worker
