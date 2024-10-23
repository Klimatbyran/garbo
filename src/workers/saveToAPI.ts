import { askPrompt } from '../openai'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { fetchCompany, saveCompany } from '../lib/api'
import { getReportingPeriodDates } from '../lib/reportingPeriodDates'
import discord from '../discord'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    apiSubEndpoint: string
    companyName?: string
    wikidata: any
    fiscalYear: any
    scope12?: any
    scope3?: any
    industry?: any
    approved?: boolean
  }
}

const worker = new DiscordWorker('saveToAPI', async (job: JobData) => {
  const {
    apiSubEndpoint = 'general',
    companyName,
    url,
    fiscalYear,
    wikidata,
    scope12,
    scope3,
    industry,
    approved = false,
  } = job.data

  job.sendMessage(`🤖 sparar ${companyName}.${apiSubEndpoint} till API...`)
  job.log('Values: ' + JSON.stringify(job.data, null, 2))
  const wikidataId = wikidata.node
  const existingCompany = await fetchCompany(wikidataId).catch(() => null)

  const metadata = {
    source: url,
    comment: 'Parsed by Garbo AI',
  }

  if (!approved) {
    // IDEA: Use a diff helper to compare objects and generate markdown diff
    const diff = await askPrompt(
      `What is changed between these two json values? Please respond in clear text with markdown formatting. 
The purpose is to let an editor approve the changes or suggest changes in Discord.
Be as breif as possible. Never be technical - meaning no comments about structure changes, fields renames etc.
Focus on the actual values that have changed in the following section(s): ${apiSubEndpoint}`,
      JSON.stringify({
        before: existingCompany,
        after: {
          scope12,
          scope3,
          industry,
        },
      })
    )
    job.log('Diff: ' + diff)

    const buttonRow = discord.createButtonRow(job.id)
    job.sendMessage({
      content: `# ${companyName}
${diff.slice(0, 2000)}`,
      components: [buttonRow],
    })
    return 'Waiting for approval'
  }

  if (approved && scope12) {
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
    job.log('Saved scope1 and/or scope2')
  }

  if (approved && scope3) {
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
    job.log('Saved scope3')
  }

  if (approved && industry) {
    job.editMessage(`🤖 Sparar GICS industri...`)
    await saveCompany(wikidataId, 'industry', {
      industry,
      metadata,
    })
    job.log('Saved industry')
  }
  return 'saved'
})

export default worker
