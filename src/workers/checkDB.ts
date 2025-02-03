import { FlowProducer } from 'bullmq'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { apiFetch } from '../lib/api'
import redis from '../config/redis'
import { getCompanyURL } from '../lib/saveUtils'

export class CheckDBJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    description?: string
    wikidata: { node: string }
    fiscalYear: any
    childrenValues?: any
    approved?: boolean
  }
}

const flow = new FlowProducer({ connection: redis })

const checkDB = new DiscordWorker('checkDB', async (job: CheckDBJob) => {
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

    await job.sendMessage(
      `✅ Företaget har skapats! Se resultatet här: ${getCompanyURL(
        companyName,
        wikidataId
      )}`
    )
  }

  const {
    scope12,
    scope3,
    biogenic,
    industry,
    economy,
    baseYear,
    goals,
    initiatives,
  } = childrenValues

  const base = {
    name: companyName,
    data: {
      existingCompany,
      companyName,
      url,
      fiscalYear,
      wikidata,
      threadId,
      channelId,
    },
    opts: {
      attempts: 3,
    },
  }

  await job.editMessage(`🤖 Sparar data...`)

  await flow.add({
    ...base,
    queueName: 'sendCompanyLink',
    data: {
      ...base.data,
    },
    children: [
      scope12 || scope3 || biogenic || economy
        ? {
            ...base,
            queueName: 'diffReportingPeriods',
            data: {
              ...base.data,
              scope12,
              scope3,
              biogenic,
              economy,
            },
          }
        : null,
      industry
        ? {
            ...base,
            queueName: 'diffIndustry',
            data: {
              ...base.data,
              industry,
            },
          }
        : null,
      goals
        ? {
            ...base,
            queueName: 'diffGoals',
            data: {
              ...base.data,
              goals,
            },
          }
        : null,
      baseYear
        ? {
            ...base,
            queueName: 'diffBaseYear',
            data: {
              ...base.data,
              baseYear,
            },
          }
        : null,
      initiatives
        ? {
            ...base,
            queueName: 'diffInitiatives',
            data: {
              ...base.data,
              initiatives,
            },
          }
        : null,
    ].filter((e) => e !== null),
  })

  return { saved: true }
})

export default checkDB
