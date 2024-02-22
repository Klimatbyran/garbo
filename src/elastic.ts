import config from './config/elasticsearch';
import { Client } from '@elastic/elasticsearch';
import * as crypto from 'crypto';

class Elastic {
  client: Client;
  indexName: string;

  constructor({ node, indexName }) {
    try  {
      this.client = new Client({ node });
      this.indexName = indexName;
    } catch (error) {
      console.error('Elasticsearch constructor error:', error);
    }
  }

  // Hash the URL to use as the document ID
  private hashUrl(url: string): string {
    return crypto.createHash('sha256').update(url).digest('hex');
  }

  async setupIndex() {
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
                pdf: { type: 'binary' },
                report: { type: 'text' },
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

  async createEntryWithUrl(url: string) {
    const documentId = this.hashUrl(url);
    const docBody = {
      url: url,
      state: 'pending',
      timestamp: new Date()
    };

    try {
      await this.client.index({
        index: this.indexName,
        id: documentId,
        body: docBody
      });
      console.log(`Entry created with PDF URL. Document ID: ${documentId}`);
    } catch (error) {
      console.error(`Error creating entry with PDF URL for Document ID ${documentId}:`, error);
    }
  }

  async addPDFContent(url: string, pdfContent: string) {
    const documentId = this.hashUrl(url);
    try {
      await this.client.update({
        index: this.indexName,
        id: documentId,
        body: {
          doc: {
            pdf: pdfContent
          }
        }
      });
      console.log(`PDF content added. Document ID: ${documentId}`);
    } catch (error) {
      console.error(`Error adding PDF content for Document ID ${documentId}:`, error);
    }
  }

  async addReportData(url: string, reportData: object) {
    const documentId = this.hashUrl(url);
    try {
      await this.client.update({
        index: this.indexName,
        id: documentId,
        body: {
          doc: {
            report: reportData
          }
        }
      });
      console.log(`Report data added. Document ID: ${documentId}`);
    } catch (error) {
      console.error(`Error adding report data for Document ID ${documentId}:`, error);
    }
  }

  async updateDocumentState(url: string, newState: string) {
    const documentId = this.hashUrl(url);
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
}

export default new Elastic(config)
