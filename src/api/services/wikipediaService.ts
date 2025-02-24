import { Emissions, ReportingPeriod } from '@prisma/client'
import { getWikipediaTitle } from '../../lib/wikidata'
import { EntityId } from 'wikibase-sdk'
import { getWikipediaContent, updateWikipediaContent, generateWikipediaArticleText, generateWikipediaInfoBox } from '../../lib/wikipedia'
import { emissionsService } from './emissionsService'
import { reportingPeriodService } from './reportingPeriodService'

const LANGUAGE = "sv"

class WikipediaService {
  async updateWikipedia(wikidataId: string) {
    const title = await getWikipediaTitle(wikidataId as EntityId)

    if (!title) {
      throw new Error('No Wikipedia site link found')
    }

    const emissions: Emissions = await emissionsService.getLatestEmissionsByWikidataId(wikidataId)
    const newText: string = generateWikipediaArticleText(emissions, LANGUAGE)
    const currentContent: string = await getWikipediaContent(title) as string

    //TODO: update this when there is an infobox template for emissions data
    //const newInfoBox: string = generateWikipediaInfoBox(emissions, LANGUAGE)

    const reportingPeriod: ReportingPeriod | null = await reportingPeriodService.getLatestReportingPeriodByWikidataId(wikidataId)
    const reportURL: string = reportingPeriod?.reportURL || ''

    if (currentContent.includes(newText)) {
      throw new Error('No update needed - content already exists')
    }

    const newContent = {
      text: newText,
      reportURL: reportURL,
      //infoBox: newInfoBox,
    }

    await updateWikipediaContent(title, newContent)
  }
}
export const wikipediaService = new WikipediaService()
