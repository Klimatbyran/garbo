import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { defaultMetadata, askDiff } from '../lib/saveUtils'
import { getReportingPeriodDates } from '../lib/reportingPeriodDates'
import saveToAPI from './saveToAPI'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    existingCompany: any
    wikidata: any
    fiscalYear: any
    scope12?: any[]
    scope3?: any[]
    biogenic?: any[]
    economy?: any[]
  }
}

const diffReportingPeriods = new DiscordWorker<JobData>(
  'diffReportingPeriods',
  async (job) => {
    const {
      url,
      fiscalYear,
      companyName,
      wikidata,
      existingCompany,
      scope12 = [],
      scope3 = [],
      biogenic = [],
      economy = [],
    } = job.data
    const metadata = defaultMetadata(url)
    const wikidataId = wikidata.node

    // Get all unique years from all sources
    const years = new Set([
      ...scope12.map((d) => d.year),
      ...scope3.map((d) => d.year),
      ...biogenic.map((d) => d.year),
      ...economy.map((d) => d.year),
    ])

    // Create base reporting periods
    const reportingPeriods = Array.from(years).map((year) => {
      const [startDate, endDate] = getReportingPeriodDates(
        year,
        fiscalYear.startMonth,
        fiscalYear.endMonth
      )
      return {
        year,
        startDate,
        endDate,
        metadata,
      }
    })

    // Fill in data from each source
    const body = reportingPeriods.map(
      ({ year, startDate, endDate, metadata }) => {
        return {
          emissions: {
            scope1: scope12.find((d) => d.year === year)?.scope1,
            scope2: scope12.find((d) => d.year === year)?.scope2,
            scope3: scope3.find((d) => d.year === year)?.scope3,
            biogenic: biogenic.find((d) => d.year === year)?.biogenic,
          },
          economy: economy.find((d) => d.year === year)?.economy,
          startDate,
          endDate,
          metadata,
        }
      }
    )

    const diff = await askDiff(existingCompany?.reportingPeriods, body)
    job.log('diff: ' + diff)
    const requiresApproval = diff && !diff.includes('NO_CHANGES')

    await saveToAPI.queue.add(companyName, {
      data: {
        ...job.data,
        body,
        diff,
        requiresApproval,
        wikidataId,
      },
    })

    return { body, diff, requiresApproval }
  }
)

export default diffReportingPeriods
