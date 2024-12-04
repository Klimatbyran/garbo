import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { apiFetch } from '../lib/api'
import discord from '../discord'
import redis from '../config/redis'
import { askPrompt } from '../lib/openai'
import { formatAsReportingPeriods } from '../lib/saveUtils'

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
    economy?: any
    goals?: any
    initiatives?: any
    approved?: boolean
  }
}

const ONE_DAY = 1000 * 60 * 60 * 24

const askDiff = async (
  existingCompany,
  {
    scope12,
    scope3,
    biogenic,
    industry,
    economy,
    goals,
    initiatives,
    fiscalYear,
  }
) => {
  if (
    (scope12 || scope3 || biogenic) &&
    !existingCompany.reportingPeriods?.length
  )
    return ''
  if (economy && !existingCompany.reportingPeriods.length) return ''
  if (goals && !existingCompany.goals) return ''
  if (initiatives && !existingCompany.initiatives) return ''
  if (industry && !existingCompany.industry) return ''

  const updated = {
    scope12,
    scope3,
    biogenic,
    industry,
    economy,
    goals,
    initiatives,
  }

  const getCompanyBeforeAfter = () =>
    Object.keys(updated).reduce(
      ([before, after], key) => {
        if (Array.isArray(updated[key]) ? updated[key].length : updated[key]) {
          if (key === 'economy') {
            before['reportingPeriods'] = (
              existingCompany.reportingPeriods ?? []
            ).map(({ startDate, endDate, economy }) => ({
              startDate,
              endDate,
              economy,
            }))
            after['reportingPeriods'] = formatAsReportingPeriods(
              updated.economy,
              fiscalYear,
              'economy'
            )
          } else if (key === 'scope12') {
            before['reportingPeriods'] = (
              existingCompany.reportingPeriods ?? []
            ).map(({ startDate, endDate, emissions }) => ({
              startDate,
              endDate,
              emissions: emissions
                ? {
                    scope1: emissions.scope1,
                    scope2: emissions.scope2,
                  }
                : null,
            }))
            after['reportingPeriods'] = formatAsReportingPeriods(
              updated.scope12,
              fiscalYear,
              'emissions'
            )
          } else if (key === 'scope3') {
            before['reportingPeriods'] = (
              existingCompany.reportingPeriods ?? []
            ).map(({ startDate, endDate, emissions }) => ({
              startDate,
              endDate,
              emissions: emissions
                ? {
                    scope3: emissions.scope3,
                  }
                : null,
            }))
            after['reportingPeriods'] = formatAsReportingPeriods(
              updated.scope3,
              fiscalYear,
              'emissions'
            )
          } else if (key === 'biogenic') {
            before['reportingPeriods'] = (
              existingCompany.reportingPeriods ?? []
            ).map(({ startDate, endDate, emissions }) => ({
              startDate,
              endDate,
              emissions: emissions
                ? {
                    biogenic: emissions.biogenic,
                  }
                : null,
            }))
            after['reportingPeriods'] = formatAsReportingPeriods(
              updated.biogenic,
              fiscalYear,
              'emissions'
            )
          } else if (['initiatives', 'goals', 'industry'].includes(key)) {
            before[key] = existingCompany[key]
            after[key] = updated[key]
          }
        }
        return [before, after]
      },
      [{}, {}]
    )

  const [before, after] = getCompanyBeforeAfter()

  const diff = await askPrompt(
    `What is changed between these two json values? Please respond in clear text with markdown formatting. 
The purpose is to let an editor approve the changes or suggest changes in Discord.
Be as breif as possible. Never be technical - meaning no comments about structure changes, fields renames etc.
Focus only on the actual values that have changed.
When handling years and ambigous dates, always use the last year in the period (e.g. startDate: 2020 - endDate: 2021 should be referred to as 2021).
NEVER REPEAT UNCHANGED VALUES OR UNCHANGED YEARS! If nothing important has changed, just write "NO_CHANGES".`,
    JSON.stringify({
      before,
      after,
    })
  )

  return diff
}

const saveToAPI = new DiscordWorker<JobData>(
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
      economy = [],
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

    const diff = !approved
      ? await askDiff(existingCompany, {
          scope12,
          scope3,
          biogenic,
          industry,
          goals,
          initiatives,
          economy,
          fiscalYear,
        })
      : ''

    if (diff) {
      if (diff.includes('NO_CHANGES')) {
        await job.sendMessage({
          content: `# ${companyName}: \`${apiSubEndpoint}\`
          ${diff}`.slice(0, 2000),
        })

        return diff
      }

      const buttonRow = discord.createButtonRow(job.id!)
      await job.sendMessage({
        content: `# ${companyName}: \`${apiSubEndpoint}\`
        ${diff}`.slice(0, 2000),
        components: [buttonRow],
      })

      return await job.moveToDelayed(Date.now() + ONE_DAY)
    }

    // Queue the appropriate specialized worker based on the data
    if (scope12?.length || scope3?.length || biogenic?.length) {
      return await job.queueChild('saveEmissions', {
        scope12,
        scope3,
        biogenic,
      })
    }

    if (industry) {
      job.editMessage(`🤖 Sparar GICS industri...`)
      return await apiFetch(`/companies/${wikidataId}/industry`, {
        body: {
          industry,
          metadata: defaultMetadata(url),
        },
        method: 'PUT',
      })
    }

    if (goals) {
      return await job.queueChild('saveGoals', { goals })
    }

    if (initiatives) {
      return await job.queueChild('saveInitiatives', { initiatives })
    }

    if (economy?.length) {
      return await job.queueChild('saveEconomy', { economy })
    }

    throw new Error('No data to save')
  },
  {
    concurrency: 10,
    connection: redis,
  }
)

export default saveToAPI
