import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { getWikipediaTitle } from '../lib/wikidata'
import { generateWikipediaArticleText, updateWikipediaContent } from '../lib/wikipedia'
import { Emissions } from '@prisma/client'
import wikipediaConfig from '../config/wikipedia'
import { QUEUE_NAMES } from '../queues'

export class WikipediaUploadJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    wikidata: { node: `Q${number}` }
    existingCompany: any
  }
}

const checkEmissionsExist = (emissions: Emissions): boolean => {
  return (
    emissions.scope1?.total ||
    emissions.scope2?.mb ||
    emissions.scope2?.lb ||
    emissions.scope3?.statedTotalEmissions?.total ||
    emissions.scope3?.categories?.length
  )
}

const wikipediaUpload = new DiscordWorker<WikipediaUploadJob>(
  QUEUE_NAMES.WIKIPEDIA_UPLOAD,
  async (job) => {
    const {
      wikidata,
      existingCompany
    } = job.data

    const reportingPeriod = existingCompany.reportingPeriods[0]
    const year: string = reportingPeriod.startDate.split('-')[0]
    const emissions: Emissions = reportingPeriod.emissions
    const title: string = await getWikipediaTitle(wikidata.node)

    if (!checkEmissionsExist(emissions)) {
      job.editMessage(`❌ No emissions found`)
      console.error('No emissions found')
      throw Error('No emissions found')
    }

    if (!title) {
      job.editMessage(`❌ No Wikipedia page found`)
      console.error('No Wikipedia page found')
      throw Error('No Wikipedia page found')
    }

    const text: string = generateWikipediaArticleText(emissions, title, year, wikipediaConfig.language)
    const reportURL: string = reportingPeriod.reportURL
    const content = {
      text,
      reportURL
    }

    try {
      await updateWikipediaContent(title, content)
    } catch(e) {
      job.editMessage(`❌ Error updating Wikipedia: ${e.message}`)
      throw e
    }

    return { success: true }
  }
)

export default wikipediaUpload