import { Company, BaseYear, Metadata } from '@prisma/client'
import { prisma } from '../../lib/prisma'

class WikidataService {
  async updateWikidata(wikidataId: string) {
    const data: Company = prisma.company.findFirstOrThrow({
      where: { wikidataId },
      include: { baseYear: true },
    })

    // fetch data from wikidata
    
    // compare

    // call the wikidata lib to update
  }
}
export const wikidataService = new WikidataService()
