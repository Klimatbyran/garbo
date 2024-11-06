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
    goals?: any
    initiatives?: any
    approved?: boolean
  }
}

const ONE_DAY = 1000 * 60 * 60 * 24

const askDiff = async (
  existingCompany,
  { scope12, scope3, biogenic, industry, initiatives, goals }
) => {
  if (
    (scope12 || scope3 || biogenic) &&
    !existingCompany.reportingPeriods?.length
  )
    return ''
  if (industry && !existingCompany.industry) return ''
  if (initiatives && !existingCompany.initiatives) return ''
  if (goals && !existingCompany.goals) return ''
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
        initiatives,
        goals,
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
      goals,
      initiatives,
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
      ? await askDiff(existingCompany, {
          scope12,
          scope3,
          biogenic,
          industry,
          initiatives,
          goals,
        })
      : ''

    // TODO: Figure out why the diff doesn't work reliably for goals and initiatives
    // It sometimes doesn't save goals or initiatives, even though they are empty and we have a value we want to save
    // This is likely a race condition, causing the slower updates to always go through a manual review, even though the data is not available.
    // What if we only kept the defined keys within the existingCompany (before) and the new one (after)?
    // That way, we might reduce the cluttering and keep the diff more focused on actual changes?
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

      // TODO: Figure out why we sometimes get "This interaction failed" as an error message after approving in discord
      if (goals) {
        job.editMessage(`🤖 Sparar mål...`)
        return await apiFetch(`/companies/${wikidataId}/goals`, {
          body: {
            goals,
            metadata,
          },
          method: 'POST',
        })
      }

      if (initiatives) {
        job.editMessage(`🤖 Sparar initiativ...`)
        return await apiFetch(`/companies/${wikidataId}/initiatives`, {
          body: {
            initiatives,
            metadata,
          },
          method: 'POST',
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
