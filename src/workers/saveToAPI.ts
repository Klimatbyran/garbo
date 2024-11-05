import { askPrompt } from '../openai'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { apiFetch } from '../lib/api'
import { getReportingPeriodDates } from '../lib/reportingPeriodDates'
import discord from '../discord'
import redis from '../config/redis'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    apiSubEndpoint: string
    companyName?: string
    wikidata: any
    fiscalYear: any
    scope12?: any
    scope3?: any
    biogenic?: any
    industry?: any
    approved?: boolean
  }
}

const ONE_DAY = 1000 * 60 * 60 * 24

const askDiff = async (
  existingCompany,
  { scope12, scope3, biogenic, industry }
) => {
  if (
    (scope12 || scope3 || biogenic) &&
    !existingCompany.reportingPeriods?.length
  )
    return ''
  if (industry && !existingCompany.industry) return ''
  // IDEA: Use a diff helper to compare objects and generate markdown diff
  const diff = await askPrompt(
    `What is changed between these two json values? Please respond in clear text with markdown formatting. 
The purpose is to let an editor approve the changes or suggest changes in Discord.
Be as breif as possible. Never be technical - meaning no comments about structure changes, fields renames etc.
Focus only on the actual values that have changed.
When handling years and ambigous dates, always use the last year in the period (e.g. startDate: 2020 - endDate: 2021 should be referred to as 2021).
NEVER REPEAT UNCHANGED VALUES OR UNCHANGED YEARS! If nothing important has changed, just write "NO CHANGES".`,
    JSON.stringify({
      before: existingCompany,
      after: {
        scope12,
        scope3,
        biogenic,
        industry,
      },
    })
  )

  return diff
}

/**
 * Group all emissions data related to each reporting period.
 * Saving everything at once avoids race conditions.
 */
function groupEmissionsByReportingPeriod({
  scope12,
  scope3,
  biogenic,
  fiscalYear,
  metadata,
}) {
  const reportingPeriods: Record<
    string,
    {
      startDate: string
      endDate: string
      emissions: {
        scope1?: any
        scope2?: any
        scope3?: any
        biogenic?: any
        statedTotalEmissions?: any
      }
      metadata: any
    }
  > = {}

  function getReportingPeriodEmissions(year: number) {
    const [startDate, endDate] = getReportingPeriodDates(
      year,
      fiscalYear.startMonth,
      fiscalYear.endMonth
    )

    return {
      startDate,
      endDate,
      emissions: {},
      metadata,
    }
  }

  scope12.forEach(({ year, scope1, scope2 }) => {
    reportingPeriods[year] ??= getReportingPeriodEmissions(year)

    reportingPeriods[year].emissions = {
      ...reportingPeriods[year].emissions,
      scope1,
      scope2,
    }
  })

  scope3.forEach(({ year, scope3 }) => {
    reportingPeriods[year] ??= getReportingPeriodEmissions(year)

    reportingPeriods[year].emissions = {
      ...reportingPeriods[year].emissions,
      scope3,
    }
  })

  biogenic.forEach(({ year, biogenic }) => {
    reportingPeriods[year] ??= getReportingPeriodEmissions(year)

    reportingPeriods[year].emissions = {
      ...reportingPeriods[year].emissions,
      biogenic,
    }
  })

  return reportingPeriods
}

const worker = new DiscordWorker<JobData>(
  'saveToAPI',
  async (job) => {
    const {
      apiSubEndpoint = 'general',
      companyName,
      url,
      fiscalYear,
      wikidata,
      scope12 = [],
      scope3 = [],
      biogenic = [],
      industry,
      approved = false,
    } = job.data

    job.sendMessage(`🤖 sparar ${companyName}.${apiSubEndpoint} till API...`)
    const wikidataId = wikidata.node
    const existingCompany = await apiFetch(`/companies/${wikidataId}`).catch(
      () => null
    )

    const metadata = {
      source: url,
      comment: 'Parsed by Garbo AI',
    }
    const diff = !approved
      ? await askDiff(existingCompany, { scope12, scope3, biogenic, industry })
      : ''

    if (diff) {
      const buttonRow = discord.createButtonRow(job.id)
      // TODO: Add info about diff type to the message title to make it easier to review the changes
      await job.sendMessage({
        content: `# ${companyName}
${diff}`.slice(0, 2000),
        components: [buttonRow],
      })

      if (diff === 'NO CHANGES') {
        return diff
      }

      return await job.moveToDelayed(Date.now() + ONE_DAY)
    } else {
      if (scope12?.length || scope3?.length || biogenic?.length) {
        job.editMessage(`🤖 Sparar utsläppsdata...`)

        const reportingPeriods = groupEmissionsByReportingPeriod({
          scope12,
          scope3,
          biogenic,
          fiscalYear,
          metadata,
        })

        return Promise.all(
          Object.entries(reportingPeriods).map(([year, reportingPeriod]) => {
            job.log(
              `Saving [${Object.keys(reportingPeriod.emissions).join(
                ', '
              )}] for ${reportingPeriod.startDate}-${reportingPeriod.endDate}`
            )
            job.sendMessage(
              `🤖 ${year}: Sparar utsläppsdata [${Object.keys(
                reportingPeriod.emissions
              ).join(', ')}]...`
            )
            return apiFetch(`/companies/${wikidataId}/${year}/emissions`, {
              body: reportingPeriod,
            })
          })
        )
      }

      if (industry) {
        job.editMessage(`🤖 Sparar GICS industri...`)
        return await apiFetch(`/companies/${wikidataId}/industry`, {
          body: {
            industry,
            metadata,
          },
          method: 'PUT',
        })
      }
      throw new Error('No data to save')
    }
  },
  {
    concurrency: 10,
    connection: redis,
  }
)

export default worker
