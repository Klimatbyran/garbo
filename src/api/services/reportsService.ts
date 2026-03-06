import Firecrawl, { Document, SearchResultWeb } from '@mendable/firecrawl-js'
import { CompanyReports } from '../types'
import { pdf } from 'pdf-to-img'
import { writeFile } from 'fs/promises'
import ky from 'ky'
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

      if (!searchResult.web || searchResult.web.length === 0) {
        results.push({
          companyName: company.name,
          results: [],
        })
        continue
      }

      searchResult.web = await Promise.all(
        searchResult.web.map(async (result) => {
          const endUrl = await ky(result.url)
          if (endUrl.url.endsWith('.pdf')) {
            return { ...result, url: endUrl.url }
          }
          return result
        })
      )

      for (let i = 0; i < searchResult.web.length; i++) {
        const response = await ky(searchResult.web[i].url)
        const arrayBuffer = await response.arrayBuffer()
        const pdfBuffer = Buffer.from(arrayBuffer)

        const document = await pdf(pdfBuffer, { scale: 4 })
        const pageBuffer = await document.getPage(1)

        await writeFile(`page-${i}.png`, pageBuffer)
      }
    }

    return results
  }

  async getAllCompanies() {
    const companies = await prisma.company.findMany({
      select: {
        name: true,
        wikidataId: true,
        reportingPeriods: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            reportURL: true,
          },
        },
      },
    })
    return companies
  }
}

export const reportsService = new ReportsService()
