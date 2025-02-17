import { Company, Emissions } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { getWikipediaTitle } from '../../lib/wikidata'
import { EntityId } from 'wikibase-sdk'
import { getWikipediaContent, updateWikipediaContent } from '../../lib/wikipedia'
import { emissionsService } from './emissionsService'

class WikipediaService {
  async updateWikipedia(wikidataId: string) {
    const title = await getWikipediaTitle(wikidataId as EntityId)

    if (!title) {
      throw new Error('No Wikipedia site link found')
    }
    
    const wikiContent = await getWikipediaContent(title)

    // TODO: Check if emissions data is already on the page
    
    const company: Company = await prisma.company.findFirstOrThrow({
      where: { wikidataId },
      include: { reportingPeriods: { include: { emissions: true } } },
    })

    const emissions: Emissions = await emissionsService.getLatestEmissionsByWikidataId(wikidataId)

    await updateWikipediaContent(title, JSON.stringify(emissions))

    // generate article text
    // generate fact box data
    // generate reference data
  }
}
export const wikipediaService = new WikipediaService()
