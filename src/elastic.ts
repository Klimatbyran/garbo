import config from './config/elasticsearch';
import { Client } from '@elastic/elasticsearch';

class Elastic {
  client: Client;
  indexName: string;

  constructor({ node, indexName }) {
    this.client = new Client({ node });
    this.indexName = indexName;
  }

  async setupIndex() {
    const indexExists = await this.client.indices.exists({ index: this.indexName });
    if (!indexExists) {
      await this.client.indices.create({
        index: this.indexName,
        body: {
          mappings: {
            properties: {
              pdf: { type: 'binary' },
              report: { type: 'object' },
              state: { type: 'keyword' }
            }
          }
        }
      });
      console.log(`Index ${this.indexName} created.`);
    } else {
      console.log(`Index ${this.indexName} already exists.`);
    }
  }

  async indexDocument(documentId: string, pdfContent: string, reportData: object = null) {
    const docBody = {
      pdf: pdfContent,
      report: reportData,
      state: 'pending'
    };

    await this.client.index({
      index: this.indexName,
      id: documentId,
      body: docBody
    });

    console.log(`Document ${documentId} indexed.`);
  }

  async updateDocumentState(documentId: string, newState: string) {
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
  }
}

export default new Elastic(config)
