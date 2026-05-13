import Firecrawl, { SearchResultWeb } from '@mendable/firecrawl-js'
import { CompanyReports, SaveReportsBody, SaveReportsResult } from '../types'
import { pdf } from 'pdf-to-img'
import ky from 'ky'
import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import sharp from 'sharp'
import { ReportsListResponseSchema } from '../schemas/response'
import { z } from 'zod'
import { registryService } from './registryService'

const API_KEY = process.env.FIRECRAWL_API_KEY

// TODO: Evaluate mapping the firecrawler type to internal type definition.
type ReportsListResponse = z.infer<typeof ReportsListResponseSchema>

class ReportsService {
  async collectReportUrls(
    companies: CompanyReports
  ): Promise<ReportsListResponse> {
    const firecrawl = new Firecrawl({ apiKey: API_KEY })
    const results: ReportsListResponse = []

    for (const company of companies) {
      const year = company.reportYear ? `${company.reportYear}` : ''
      const searchQuery = `${company.name} ${year} (sustainability report OR annual report) filetype:pdf ${company.country ? `${company.country}` : 'Sweden'}`
      const searchResult = await firecrawl.search(searchQuery, { limit: 5 })

      let companyResults: Array<{
        url?: string
        title?: string
        description?: string
        position?: number
      }> = []
      if (searchResult.web && searchResult.web.length > 0) {
        companyResults = await Promise.all(
          searchResult.web
            .filter((result): result is SearchResultWeb => 'url' in result)
            .map(async (result, idx) => {
              try {
                const endUrl = await ky(result.url)
                if (endUrl.url.endsWith('.pdf')) {
                  return {
                    url: endUrl.url,
                    title: result.title,
                    description: result.description,
                    position: idx,
                  }
                }
              } catch {
                // Fallback to original URL if ky fails
                return {
                  url: result.url,
                  title: result.title,
                  description: result.description,
                  position: idx,
                  error: 'Failed to resolve PDF link',
                }
              }
              return {
                url: result.url,
                title: result.title,
                description: result.description,
                position: idx,
              }
            })
        )
      }

      results.push({
        companyName: company.name,
        results: companyResults,
      })
    }

    return results
  }

  /**
   * Generates a preview image (JPG) from the first page of a PDF URL.
   * Returns a data URL or null if failed.
   */
  async generateReportPreview(pdfUrl: string): Promise<Buffer | null> {
    try {
      const response = await ky(pdfUrl)
      const arrayBuffer = await response.arrayBuffer()
      const pdfBuffer = Buffer.from(arrayBuffer)
      const document = await pdf(pdfBuffer, { scale: 0.5 })
      const pageBuffer = await document.getPage(1)

      const jpegBuffer = await sharp(pageBuffer)
        .jpeg({ quality: 60 })
        .toBuffer()
      return jpegBuffer
    } catch {
      return null
    }
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
            reportS3Url: true,
            reportSha256: true,
          },
        },
      },
    })
    return companies
  }

  async saveReportsToDb(
    saveReportsBody: SaveReportsBody
  ): Promise<SaveReportsResult> {
    const results: SaveReportsResult = []

    for (const report of saveReportsBody) {
      try {
        const saved = await registryService.upsertReportInRegistry({
          companyName: report.companyName,
          wikidataId: report.wikidataId ?? undefined,
          reportYear: report.reportYear,
          url: report.url,
          sourceUrl: report.sourceUrl,
          s3Url: report.s3Url,
          s3Key: report.s3Key,
          s3Bucket: report.s3Bucket,
          sha256: report.sha256,
        })

        results.push({
          id: saved.id,
          companyName: saved.companyName,
          wikidataId: saved.wikidataId,
          reportYear: saved.reportYear,
          url: saved.url,
        })
      } catch (error: unknown) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          results.push({
            error: 'duplicate',
            companyName: report.companyName,
            reportYear: report.reportYear,
            message: 'A report with this URL already exists.',
          })
          continue
        }

        results.push({
          error: 'unknown',
          companyName: report.companyName,
          reportYear: report.reportYear,
          message: 'Failed to save report.',
        })
      }
    }

    return results
  }
}
export const reportsService = new ReportsService()
