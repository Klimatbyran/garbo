import config from './config/opensearch'
import { Client } from '@opensearch-project/opensearch'
import * as crypto from 'crypto'
import mappings from './data/mappings.json'

class Opensearch {
  client: Client
  indexName: string
  pdfIndex: string

  constructor({ node, indexName }) {
    try {
      this.client = new Client({ node })
      this.indexName = indexName
      this.pdfIndex = 'pdfs'
    } catch (error) {
      console.error('Node URL:', node)
      console.error('Index name:', indexName)
      console.error('Opensearch constructor error:', error)
    }
  }

  async setupIndices() {
    await this.createEmissionsIndex()
    await this.createPdfIndex()
  }

  private async createPdfIndex() {
    try {
      console.log(`Checking if index ${this.pdfIndex} exists...`)
      const indexExists = await this.client.indices.exists({
        index: this.pdfIndex,
      })
      if (!indexExists) {
        await this.client.indices.create({
          index: this.pdfIndex,
          body: {
            mappings: {
              properties: {
                pdf: { type: 'binary' },
              },
            },
          },
        })
        console.log(`Index ${this.pdfIndex} created.`)
      } else {
        console.log(`Index ${this.pdfIndex} already exists.`)
      }
    } catch (error) {
      console.error('Opensearch pdfIndex error:', error)
    }
  }

  private async createEmissionsIndex() {
    try {
      console.log(`Checking if index ${this.indexName} exists...`)
      const indexExists = await this.client.indices.exists({
        index: this.indexName,
      })
      if (!indexExists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            mappings,
          },
        })
        console.log(`Index ${this.indexName} created.`)
      } else {
        console.log(`Index ${this.indexName} already exists.`)
      }
    } catch (error) {
      console.error('Opensearch setupIndex error:', error)
    }
  }

  public hashPdf(pdfBuffer: Buffer): string {
    return crypto.createHash('sha256').update(pdfBuffer).digest('hex')
  }

  // Index the PDF using the hash as document ID and returning it for reference
  async indexPdf(pdfBuffer: ArrayBuffer) {
    const buffer = Buffer.from(pdfBuffer)
    const pdfHash = this.hashPdf(buffer)

    try {
      const encodedPdf = buffer.toString('base64')
      await this.client.index({
        index: this.pdfIndex,
        id: pdfHash,
        body: {
          pdf: encodedPdf,
        },
      })
      console.log(`PDF indexed. Document ID: ${pdfHash}`)
      return pdfHash
    } catch (error) {
      console.error(`Error indexing PDF for Document ID ${pdfHash}:`, error)
      // return anyway, as the report is still added later
      return pdfHash
    }
  }

  async indexReport(documentId: string, pdfHash: string, reportData: any) {
    try {
      if (this.client === null) throw new Error('Opensearch not connected')

      let parsed
      if (typeof reportData === 'string') {
        console.log('Parsing report data')
        parsed = JSON.parse(reportData)
      } else if (typeof reportData === 'object') {
        console.log('Report data is already parsed')
        parsed = reportData
      } else {
        throw new Error('reportData is neither a string nor an object')
      }

      // Convert from array to object for easier access in opensearch
      const emissions = parsed.emissions.reduce((acc, curr) => {
        acc[curr.year] = curr
        return acc
      }, {})

      const report = {
        ...parsed,
        emissions,
      }

      const response = await this.client.index({
        index: this.indexName,
        id: documentId,
        body: {
          pdfHash: pdfHash,
          report,
          state: 'pending',
          timestamp: new Date(),
        },
      })
      console.log(`Report data added. Document ID: ${documentId}`)
      return documentId
    } catch (error) {
      console.error(`Error adding report data:`, error)
      throw error
    }
  }

  async getReportData(documentId: string) {
    try {
      const response = await this.client.get({
        index: this.indexName,
        id: documentId,
      })

      if (response.found) {
        console.log('Report data retrieved successfully.')
        return response._source
      } else {
        console.error('No report found for the given document ID.')
        return null
      }
    } catch (error) {
      console.error(`Error retrieving report data:`, error)
      return null
    }
  }

  async updateDocumentState(documentId: string, newState: string) {
    try {
      await this.client.update({
        index: this.indexName,
        id: documentId,
        body: {
          doc: {
            state: newState,
          },
        },
      })
      console.log(`Document ${documentId} state updated to ${newState}.`)
    } catch (error) {
      console.error(
        `Error updating document state for Document ID ${documentId}:`,
        error
      )
    }
  }

  // TODO support report per year and company (not only latest approved). So; get the latest approved report for each company and year
  async getAllLatestApprovedReports() {
    try {
      if (!this.client) throw new Error('Opensearch not connected')
      console.log('fetching company reports')
      const result = (await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: [
                {
                  terms: {
                    state: ['approved'],
                  },
                },
              ],
            },
          },
          sort: [
            {
              'report.companyName.keyword': {
                order: 'asc',
              },
              timestamp: {
                order: 'desc',
              },
            },
          ],
          size: 1000,
          aggs: {
            latest_reports: {
              terms: {
                field: 'report.companyName.keyword',
                size: 1000,
                order: {
                  latest_timestamp: 'desc',
                },
              },
              aggs: {
                latest_timestamp: {
                  max: {
                    field: 'timestamp',
                  },
                },
                latest_report: {
                  top_hits: {
                    size: 1,
                    sort: [
                      {
                        timestamp: {
                          order: 'desc',
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      })) as any

      console.log('result', result)
      const reports =
        result.body.hits?.hits?.map(({ _source: item, _id, pdfHash, url }) => ({
          ...item.report,
          url: url || item.report.url,
          id: pdfHash || _id,
        })) || []
      return reports
    } catch (error) {
      console.error('Error fetching latest approved reports:', error)
      return null
    }
  }
}

export default new Opensearch(config)
