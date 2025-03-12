import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { getWikipediaTitle } from '../lib/wikidata'
import { generateWikipediaArticleText, updateWikipediaContent } from '../lib/wikipedia'
import { Emissions } from '@prisma/client'

export class WikipediaUploadJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    fiscalYear: any
    wikidata: { node: `Q${number}` }
    body?: any
  }
}

const wikipediaUpload = new DiscordWorker<WikipediaUploadJob>(
  'wikipediaUpload',
  async (job) => {
    const {
      wikidata,
      body

    } = job.data
    

    const reportingPeriod = body.reportingPeriods[0]
    const year: string = reportingPeriod.startDate.split('-')[0]
    const emissions: Emissions = reportingPeriod.emissions
    const title: string = await getWikipediaTitle(wikidata.node)
    const text: string = generateWikipediaArticleText(emissions, title, year, 'sv')
    const reportURL: string = reportingPeriod.reportURL
    const content = {
      text,
      reportURL
    }

    await updateWikipediaContent(title, content)

    return { success: true }
  }
)

export default wikipediaUpload