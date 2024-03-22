import config from './config/elasticsearch';
import { Client } from '@elastic/elasticsearch';
import * as crypto from 'crypto';

class Elastic {
  client: Client;
  indexName: string;
  pdfIndex: string;

  constructor({ node, indexName }) {
    try  {
      this.client = new Client({ node });
      this.indexName = indexName;
      this.pdfIndex = 'pdfs';
    } catch (error) {
      console.error('Elasticsearch constructor error:', error);
    }
  }

  async setupIndices() {
    await this.createEmissionsIndex();
    await this.createPdfIndex();
  }

  private async createPdfIndex() {
    try {
      console.log(`Checking if index ${this.pdfIndex} exists...`);
      const indexExists = await this.client.indices.exists({ index: this.pdfIndex });
      if (!indexExists) {
        await this.client.indices.create({
          index: this.pdfIndex,
          body: {
            mappings: {
              properties: {
                pdf: { type: 'binary' },
              }
            }
          }
        });
        console.log(`Index ${this.pdfIndex} created.`);
      } else {
        console.log(`Index ${this.pdfIndex} already exists.`);
      }
    } catch (error) {
      console.error('Elasticsearch pdfIndex error:', error);
    }
  } 

  private async createEmissionsIndex() {
    try {
      console.log(`Checking if index ${this.indexName} exists...`);
      const indexExists = await this.client.indices.exists({ index: this.indexName });
      if (!indexExists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                url: { type: 'keyword' },
                pdfHash: { type: 'keyword' },
                report: {
                  type: 'nested',
                  properties: {
                    companyName: { type: 'keyword' },
                    bransch: { type: 'keyword' },
                    baseYear: { type: 'keyword' },
                    url: { type: 'keyword' },
                    emissions: {
                      type: 'nested',
                      properties: {
                        year: { type: 'keyword' },
                        scope1: {
                          properties: {
                            emissions: { type: 'double' },
                            unit: { type: 'keyword' }
                          }
                        },
                        scope2: {
                          properties: {
                            emissions: { type: 'double' },
                            unit: { type: 'keyword' },
                            mb: { type: 'double' },
                            lb: { type: 'double' }
                          }
                        },
                        scope3: {
                          properties: {
                            emissions: { type: 'double' },
                            unit: { type: 'keyword' },
                            categories: {
                              type: 'nested',
                              properties: {
                                categoryName: { type: 'keyword' },
                                emissions: { type: 'double' }
                              }
                            }
                          }
                        },
                        totalEmissions: { type: 'double' },
                        totalUnit: { type: 'keyword' },
                      }
                    },
                    reliability: { type: 'keyword' },
                    needsReview: { type: 'boolean' },
                    reviewComment: { type: 'text' },
                    reviewStatusCode: { type: 'keyword' }
                  }
                },
                state: { type: 'keyword' },
                timestamp: { type: 'date' }
              }
            }
          }
      });
      console.log(`Index ${this.indexName} created.`);
    } else {
      console.log(`Index ${this.indexName} already exists.`);
    }
    } catch (error) {
      console.error('Elasticsearch setupIndex error:', error);
    }
  }

  public hashPdf(pdfBuffer: Buffer): string {
    return crypto.createHash('sha256').update(pdfBuffer).digest('hex');
  }

  // Index the PDF using the hash as document ID and returning it for reference
  async indexPdf(pdfBuffer: ArrayBuffer) {
    const buffer = Buffer.from(pdfBuffer);
    const pdfHash = this.hashPdf(buffer);
  
    try {
      const encodedPdf = buffer.toString('base64');
      await this.client.index({
        index: this.pdfIndex,
        id: pdfHash,
        body: {
          pdf: encodedPdf,
        }
      });
      console.log(`PDF indexed. Document ID: ${pdfHash}`);
      return pdfHash;
    } catch (error) {
      console.error(`Error indexing PDF for Document ID ${pdfHash}:`, error);
      // return anyway, as the report is still added later
      return pdfHash;
    }
  }

  async indexReport(pdfHash: string, reportData: string, url: string) {
    try {
      const response = await this.client.index({
        index: this.indexName,
        body: {
          url: url,
          pdfHash: pdfHash,
          report: reportData,
          state: 'pending',
          timestamp: new Date()
        }
      });
      const documentId = response._id;
      console.log(`Report data added. Document ID: ${documentId}`);
      return documentId;
    } catch (error) {
      console.error(`Error adding report data:`, error);
    }
  }

  async updateDocumentState(documentId: string, newState: string) {
    try {
      await this.client.update({
        index: this.indexName,
        id: documentId,
        body: {
          doc: {
            state: newState
          }
        }
      });
      console.log(`Document ${documentId} state updated to ${newState}.`);
    } catch (error) {
      console.error(`Error updating document state for Document ID ${documentId}:`, error);
    }
  }

  // TODO support report per year and company (not only latest approved). So; get the latest approved report for each company and year
  async getAllLatestApprovedReports() {
    try {
      const { body } = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: [
                { match: { state: 'approved' } }
              ]
            }
          },
          sort: [
            { 'report.companyName.keyword': { order: 'asc' } },
            { timestamp: { order: 'desc' } }
          ],
          size: 1000
        }
      }) as any;
  
      const reports = body.hits.hits.map(hit => hit._source);
      const latestReports = {};
  
      reports.forEach(report => {
        const companyName = report.report.companyName;
        // If the company hasn't been added to latestReports or the current report is more recent, update it
        if (!latestReports[companyName] || new Date(latestReports[companyName].timestamp) < new Date(report.timestamp)) {
          latestReports[companyName] = report;
        }
      });
  
      return Object.values(latestReports);
    } catch (error) {
      console.error('Error retrieving all approved reports:', error);
      return [];
    }
  }

}

export default new Elastic(config)
