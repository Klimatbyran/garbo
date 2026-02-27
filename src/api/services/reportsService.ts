import Firecrawl, { Document, SearchResultWeb } from '@mendable/firecrawl-js'
import { CompanyReports } from '../types'
import { prisma } from '../../lib/prisma'

const API_KEY = process.env.FIRECRAWL_API_KEY

// TODO: Evaluate mapping the firecrawler type to internal type definition.
type CompanyReportUrls = {
  companyName: string
  results: Array<SearchResultWeb | Document>
}

class ReportsService {
  async collectReportUrls(
    companies: CompanyReports
  ): Promise<CompanyReportUrls[]> {
    const firecrawl = new Firecrawl({ apiKey: API_KEY })
    const results: CompanyReportUrls[] = []

    for (const company of companies) {
      const year = company.reportYear ? `${company.reportYear}` : ''
      const searchQuery = `"${company.name}" ${year} (sustainability report OR annual report) filetype:pdf Sweden`

      const searchResult = await firecrawl.search(searchQuery, { limit: 5 })
      console.log(searchResult)

      results.push({
        companyName: company.name,
        results: searchResult.web ?? [],
      })
    }
    return results
  }

    async getAllCompanies() {
      const companies = await prisma.company.findMany({
        select: {
          name: true,
          wikidataId: true,
          reportingPeriods: true
        },
      })
      return companies
    }
}

export const reportsService = new ReportsService()
