import Firecrawl, { Document, SearchResultWeb } from '@mendable/firecrawl-js'
import { CompanyReports } from '../types'

const API_KEY = process.env.FIRECRAWL_API_KEY

type CompanyReportUrls = {
  companyName: string
  results: Array<SearchResultWeb | Document>
}

class ReportsService {
  async collectReportUrls(
    companies: CompanyReports,
  ): Promise<CompanyReportUrls[]> {
    const firecrawl = new Firecrawl({ apiKey: API_KEY })
    const results: CompanyReportUrls[] = []

    for (const company of companies) {
      const year = company.reportYear ? `${company.reportYear}` : ''
      const searchQuery = `"${company.name}" ${year} (sustainability report OR annual report) filetype:pdf Sweden`

      const searchResult = await firecrawl.search(searchQuery, { limit: 10 })

      if (searchResult) {
        console.log(searchResult)
        results.push({
          companyName: company.name,
          results: searchResult.web ?? [],
        })
      }
    }

    console.log(results)

    return results
  }
}

export const reportsService = new ReportsService()
