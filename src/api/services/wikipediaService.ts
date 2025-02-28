import { Emissions, ReportingPeriod } from '@prisma/client'
import { getWikipediaTitle } from '../../lib/wikidata'
import { EntityId } from 'wikibase-sdk'
import { updateWikipediaContent, generateWikipediaArticleText } from '../../lib/wikipedia'
import { emissionsService } from './emissionsService'
import { reportingPeriodService } from './reportingPeriodService'

const LANGUAGE = "sv"

class WikipediaService {
  async updateWikipedia(wikidataId: string) {
    const title = await getWikipediaTitle(wikidataId as EntityId)

    if (!title) {
      throw new Error('No Wikipedia site link found')
    }

    const emissions: Emissions = await emissionsService.getLatestEmissionsAndMetadataByWikidataId(wikidataId)
    const verifiedEmissions: Emissions = {
      ...emissions,
      scope1: emissions.scope1?.metadata?.verifiedBy !== null ? emissions.scope1 : null,
      scope2: emissions.scope2?.metadata?.verifiedBy !== null ? emissions.scope2 : null,
      scope3: emissions.scope3?.metadata?.verifiedBy !== null ? emissions.scope3 : null,
      total: emissions.statedTotalEmissions?.metadata?.verifiedBy !== null ? emissions.statedTotalEmissions : null,
    }
    const newText: string = generateWikipediaArticleText(verifiedEmissions, LANGUAGE)

    //TODO: update this when there is an infobox template for emissions data
    //const newInfoBox: string = generateWikipediaInfoBox(emissions, LANGUAGE)

    const reportingPeriod: ReportingPeriod | null = await reportingPeriodService.getLatestReportingPeriodByWikidataId(wikidataId)
    const reportURL: string = reportingPeriod?.reportURL || ''

    const newContent = {
      text: newText,
      reportURL: reportURL,
      //infoBox: newInfoBox,
    }

    await updateWikipediaContent(title, newContent)
  }
}
export const wikipediaService = new WikipediaService()
