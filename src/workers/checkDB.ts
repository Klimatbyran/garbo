import { askPrompt } from '../openai'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { createCompany, fetchCompany, saveCompany } from '../lib/api'
import { getReportingPeriodDates } from '../lib/reportingPeriodDates'
import discord from '../discord'
import { saveToAPI } from '../queues'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    apiSubEndpoint: string
    companyName?: string
    wikidata: any
    fiscalYear: any
    childrenValues?: any
    approved?: boolean
  }
}

const worker = new DiscordWorker('checkDB', async (job: JobData) => {
  const { companyName, url, fiscalYear, wikidata, childrenValues } = job.data

  job.sendMessage(`🤖 kontrollerar om ${companyName} finns i API...`)
  const wikidataId = wikidata.node
  const existingCompany = await fetchCompany(wikidataId).catch(() => null)

  if (!existingCompany) {
    const metadata = {
      source: url,
      comment: 'Created by Garbo AI',
    }

    job.sendMessage(
      `🤖 Ingen tidigare data hittad för ${companyName} (${wikidataId}). Skapar...`
    )
    await createCompany({
      name: companyName,
      wikidataId,
      metadata,
    })
  }

  const { scope12, scope3, industry } = childrenValues
  if (scope12 || scope3) {
    await job.editMessage(`🤖 Skapar jobb för att spara utsläppsdata...`)
    saveToAPI.add(companyName + ' emissions', {
      apiSubEndpoint: 'emissions',
      companyName,
      url,
      fiscalYear,
      wikidata,
      scope12,
      scope3,
    })
  }

  if (industry) {
    await job.editMessage(`🤖 Skapar jobb för att spara branschdata...`)
    saveToAPI.add(companyName + ' industry', {
      apiSubEndpoint: 'industry',
      companyName,
      url,
      wikidata,
      industry,
    })
  }

  return JSON.stringify(childrenValues, null, 2)
})

export default worker
