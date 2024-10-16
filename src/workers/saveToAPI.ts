import { askPrompt } from '../openai'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { createCompany, fetchCompany, saveCompany } from '../lib/api'
import { getReportingPeriodDates } from '../lib/reportingPeriodDates'

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
  const {
    apiSubEndpoint,
    companyName,
    url,
    fiscalYear,
    wikidata,
    childrenValues,
  } = job.data

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

    // TODO: Approve changes before sending to api
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
  const { scope12, scope3, industry } = childrenValues
  job.editMessage(`🤖 Sparar utsläppsdata scope 1+2...`)
  await Promise.all(
    scope12.map(({ year, scope1, scope2 }) => {
      const [startDate, endDate] = getReportingPeriodDates(
        year,
        fiscalYear.startMonth,
        fiscalYear.endMonth
      )
      const body = {
        startDate,
        endDate,
        emissions: {
          scope1,
          scope2,
        },
        metadata,
      }
      return saveCompany(wikidataId, `${year}/emissions`, body)
    })
  )

  job.editMessage(`🤖 Sparar utsläppsdata scope 3...`)
  await Promise.all(
    scope3.map(({ year, scope3 }) => {
      const [startDate, endDate] = getReportingPeriodDates(
        year,
        fiscalYear.startMonth,
        fiscalYear.endMonth
      )
      return saveCompany(wikidataId, `${year}/emissions`, {
        startDate,
        endDate,
        emissions: {
          scope3,
        },
        metadata,
      })
    })
  )

  job.editMessage(`🤖 Sparar GICS industri...`)
  await saveCompany(wikidataId, 'industry', {
    industry,
    metadata,
  })
})

export default worker
