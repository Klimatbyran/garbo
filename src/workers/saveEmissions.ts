import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { apiFetch } from '../lib/api'
import { defaultMetadata, formatAsReportingPeriods } from '../lib/saveUtils'
import redis from '../config/redis'
import { askPrompt } from '../lib/openai'
import discord from '../discord'

const ONE_DAY = 1000 * 60 * 60 * 24

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: any
    fiscalYear: any
    scope12?: any[]
    scope3?: any[]
    biogenic?: any[]
    approved?: boolean
  }
}

const askDiff = async (existingCompany, { scope12, scope3, biogenic, fiscalYear }) => {
  if (!existingCompany.reportingPeriods?.length) return ''

  const before = {
    reportingPeriods: existingCompany.reportingPeriods.map(({ startDate, endDate, emissions }) => ({
      startDate,
      endDate,
      emissions,
    }))
  }

  const after = {
    reportingPeriods: [
      ...(scope12 ? formatAsReportingPeriods(scope12, fiscalYear, 'emissions') : []),
      ...(scope3 ? formatAsReportingPeriods(scope3, fiscalYear, 'emissions') : []),
      ...(biogenic ? formatAsReportingPeriods(biogenic, fiscalYear, 'emissions') : [])
    ]
  }

  return await askPrompt(
    `What is changed between these two json values? Please respond in clear text with markdown formatting. 
The purpose is to let an editor approve the changes or suggest changes in Discord.
Be as brief as possible. Never be technical - meaning no comments about structure changes, fields renames etc.
Focus only on the actual values that have changed.
When handling years and ambiguous dates, always use the last year in the period (e.g. startDate: 2020 - endDate: 2021 should be referred to as 2021).
NEVER REPEAT UNCHANGED VALUES OR UNCHANGED YEARS! If nothing important has changed, just write "NO_CHANGES".`,
    JSON.stringify({ before, after })
  )
}

const saveEmissions = new DiscordWorker<JobData>(
  'saveEmissions',
  async (job) => {
    const { approved = false } = job.data
    const existingCompany = await apiFetch(`/companies/${job.data.wikidata.node}`).catch(() => null)

    if (!approved) {
      const diff = await askDiff(existingCompany, job.data)
      
      if (diff) {
        if (diff.includes('NO_CHANGES')) {
          await job.sendMessage({
            content: `# ${job.data.companyName}: emissions\n${diff}`.slice(0, 2000),
          })
          return diff
        }

        const buttonRow = discord.createButtonRow(job.id!)
        await job.sendMessage({
          content: `# ${job.data.companyName}: emissions\n${diff}`.slice(0, 2000),
          components: [buttonRow],
        })

        return await job.moveToDelayed(Date.now() + ONE_DAY)
      }
    }
    const { url, fiscalYear, wikidata, scope12 = [], scope3 = [], biogenic = [] } = job.data
    const wikidataId = wikidata.node
    const metadata = defaultMetadata(url)

    if (scope12?.length || scope3?.length || biogenic?.length) {
      job.editMessage(`🤖 Sparar utsläppsdata...`)
      
      return Promise.all([
        ...(await scope12.reduce(async (lastPromise, { year, scope1, scope2 }) => {
          const arr = await lastPromise
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
          return [
            ...arr,
            await apiFetch(`/companies/${wikidataId}/${year}/emissions`, {
              body,
            }),
          ]
        }, Promise.resolve([]))),

        ...(await scope3.reduce(async (lastPromise, { year, scope3 }) => {
          const arr = await lastPromise
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
          return [
            ...arr,
            await apiFetch(`/companies/${wikidataId}/${year}/emissions`, {
              body,
            }),
          ]
        }, Promise.resolve([]))),

        ...(await biogenic.reduce(async (lastPromise, { year, biogenic }) => {
          const arr = await lastPromise
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
          return [
            ...arr,
            await apiFetch(`/companies/${wikidataId}/${year}/emissions`, {
              body,
            }),
          ]
        }, Promise.resolve([]))),
      ])
    }
    
    return null
  },
  {
    connection: redis,
  }
)

export default saveEmissions
