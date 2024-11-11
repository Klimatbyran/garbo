import { askPrompt } from '../lib/openai'
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
    economy?: any
    goals?: any
    initiatives?: any
    approved?: boolean
  }
}

const ONE_DAY = 1000 * 60 * 60 * 24

const askDiff = async (
  existingCompany,
  { scope12, scope3, biogenic, industry, economy, goals, initiatives }
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
        economy,
        goals,
        initiatives,
      },
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
          goals,
          initiatives,
          economy,
        })
      : ''

    if (diff) {
      const buttonRow = discord.createButtonRow(job.id)
      await job.sendMessage({
        content: `# ${companyName}: \`${apiSubEndpoint}\`
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
        return Promise.all([
          ...scope12.map(async ({ year, scope1, scope2 }) => {
            const [startDate, endDate] = getReportingPeriodDates(
              year,
              fiscalYear.startMonth,
              fiscalYear.endMonth
            )
            job.log(`Saving scope1 and scope2 for ${startDate}-${endDate}`)
            job.sendMessage(`🤖 Sparar utsläppsdata scope 1+2 för ${year}...`)
            const body = {
              startDate,
              endDate,
              emissions: {
                scope1,
                scope2,
              },
              metadata,
            }
            return await apiFetch(
              `/companies/${wikidataId}/${year}/emissions`,
              { body }
            )
          }),
          ...scope3.map(async ({ year, scope3 }) => {
            const [startDate, endDate] = getReportingPeriodDates(
              year,
              fiscalYear.startMonth,
              fiscalYear.endMonth
            )
            job.sendMessage(`🤖 Sparar utsläppsdata scope 3 för ${year}...`)
            job.log(`Saving scope3 for ${year}`)
            const body = {
              startDate,
              endDate,
              emissions: {
                scope3,
              },
              metadata,
            }
            return await apiFetch(
              `/companies/${wikidataId}/${year}/emissions`,
              { body }
            )
          }),
          ...biogenic.map(async ({ year, biogenic }) => {
            const [startDate, endDate] = getReportingPeriodDates(
              year,
              fiscalYear.startMonth,
              fiscalYear.endMonth
            )
            job.sendMessage(`🤖 Sparar utsläppsdata biogenic för ${year}...`)
            job.log(`Saving biogenic for ${year}`)
            const body = {
              startDate,
              endDate,
              emissions: {
                biogenic,
              },
              metadata,
            }
            return await apiFetch(
              `/companies/${wikidataId}/${year}/emissions`,
              { body }
            )
          }),
        ])
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

      if (economy?.length) {
        job.editMessage(`🤖 Sparar ekonomidata...`)
        return Promise.all([
          ...economy.map(async ({ year, economy }) => {
            const [startDate, endDate] = getReportingPeriodDates(
              year,
              fiscalYear.startMonth,
              fiscalYear.endMonth
            )
            job.log(`Saving economy for ${startDate}-${endDate}`)
            job.sendMessage(`🤖 Sparar ekonomidata för ${year}...`)
            const body = {
              startDate,
              endDate,
              economy,
              metadata,
            }
            return await apiFetch(`/companies/${wikidataId}/${year}/economy`, {
              body,
            })
          }),
        ])
      }

      throw new Error('No data to save')
    }
  },
  {
    concurrency: 10,
    connection: redis,
  }
)

export default saveToAPI
