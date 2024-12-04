import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { apiFetch } from '../lib/api'
import saveToAPI from './saveToAPI'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName?: string
    description?: string
    wikidata: any
    fiscalYear: any
    childrenValues?: any
    approved?: boolean
  }
}

const checkDB = new DiscordWorker('checkDB', async (job: JobData) => {
  const {
    companyName,
    description,
    url,
    fiscalYear,
    wikidata,
    threadId,
    channelId,
  } = job.data

  const childrenValues = await job.getChildrenEntries()
  await job.updateData({ ...job.data, childrenValues })

  job.sendMessage(`🤖 kontrollerar om ${companyName} finns i API...`)
  const wikidataId = wikidata.node
  const existingCompany = await apiFetch(`/companies/${wikidataId}`).catch(
    () => null
  )

  if (!existingCompany) {
    const metadata = {
      source: url,
      comment: 'Created by Garbo AI',
    }

    job.sendMessage(
      `🤖 Ingen tidigare data hittad för ${companyName} (${wikidataId}). Skapar...`
    )
    const body = {
      name: companyName,
      description,
      wikidataId,
      metadata,
    }
    await apiFetch(`/companies`, { body })
  }

  const { scope12, scope3, biogenic, industry, economy, goals, initiatives } = childrenValues
  
  const base = {
    name: companyName,
    data: {
      companyName,
      url,
      fiscalYear,
      wikidata,
      threadId,
      channelId,
    },
    opts: {
      attempts: 3,
    }
  }

  await job.editMessage(`🤖 Sparar data...`)

  if (scope12 || scope3 || biogenic) {
    await flow.add({
      ...base,
      queueName: 'saveEmissions',
      data: {
        ...base.data,
        scope12,
        scope3,
        biogenic
      }
    })
  }

  if (industry) {
    await flow.add({
      ...base,
      queueName: 'saveIndustry',
      data: {
        ...base.data,
        industry
      }
    })
  }

  if (economy) {
    await flow.add({
      ...base,
      queueName: 'saveEconomy',
      data: {
        ...base.data,
        economy
      }
    })
  }

  if (goals) {
    await flow.add({
      ...base,
      queueName: 'saveGoals',
      data: {
        ...base.data,
        goals
      }
    })
  }

  if (initiatives) {
    await flow.add({
      ...base, 
      queueName: 'saveInitiatives',
      data: {
        ...base.data,
        initiatives
      }
    })
  }

  // Add final step to send company link
  await flow.add({
    ...base,
    queueName: 'sendCompanyLink',
    data: {
      ...base.data,
    }
  })

  return JSON.stringify({ saved: true }, null, 2)
})

export default checkDB
