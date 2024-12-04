import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { apiFetch } from '../lib/api'
import { defaultMetadata, formatAsReportingPeriods } from '../lib/saveUtils'
import redis from '../config/redis'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: any
    fiscalYear: any
    scope12?: any[]
    scope3?: any[]
    biogenic?: any[]
  }
}

const saveEmissions = new DiscordWorker<JobData>(
  'saveEmissions',
  async (job) => {
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
