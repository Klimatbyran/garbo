import { Company, BaseYear, Metadata } from '@prisma/client'
import { prisma } from '../../lib/prisma'

class WikidataService {
  async updateWikidata(wikidataId: string) {
    return prisma.company.findFirstOrThrow({
      where: { wikidataId },
      include: { baseYear: true },
    })
  }
}
export const wikidataService = new WikidataService()
