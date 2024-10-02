import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { searchCompany } from '../lib/wikidata'
import { ask, askPrompt } from '../openai'
import { extractEmissions } from '../queues'
import { saveCompany, saveToAPI } from '../lib/api'

class JobData extends Job {
  declare data: {
    url: string
    threadId: string
    paragraphs: string[]
    previousAnswer: string
    previousError: string
  }
}

const worker = new Worker(
  'guessWikidata',
  async (job: JobData) => {
    const { previousError, previousAnswer, paragraphs, url } = job.data

    const companyName = await askPrompt(
      'What is the name of the company? Respond only with the company name. We will search Wikidata after this name. The following is an extract from a PDF:',
      paragraphs.join('-------------PDF EXTRACT-------------------\n\n')
    )

    if (!companyName) throw new Error('No company name was found')

    job.log('Searching for company name: ' + companyName)
    const results = await searchCompany(companyName)
    job.log('Results: ' + JSON.stringify(results, null, 2))
    /*
    TODO: evaluate if we need to transform the data or not
    const transformed = transformData(results)
    job.log('Transformed: ' + JSON.stringify(transformed, null, 2))
    */
    if (results.length === 0) {
      return JSON.stringify(
        { wikidata: { error: 'No wikidata page found' } },
        null,
        2
      )
    }

    const prompt = `Please choose the appropriate wikidata node and return it as json. Prioritize the node with information about GHG carbon footprint if there are any.

Needs to be valid json. No comments etc here. Never guess any values. Only use the information from the context. Company Name should be filled from the wikidata node. Keep the syntax below:
\`\`\`json
{ "wikidata":
   {
    "node": "Q123456",
    "url": "https://www.wikidata.org/wiki/Q123456",
    "logo": "https://commons.wikimedia.org/wiki/File:Example.jpg",
    "label": "Company Name",
    "description": "Company Description",
    "emissions": {
      "2023": {
        "year": "2023",
        "reference": "https://example.com/pdf.pdf",
        "scope1": {
          "emissions": 1234,
          "unit": "tCO2e"
          "verified": "https://www.wikidata.org/wiki/Q123456",
          "biogenic": 123,
        },
        "scope2": {
          "emissions": 1235,
          "unit": "tCO2e",
          "verified": "https://www.wikidata.org/wiki/Q123456",
          "mb": 1235,
          "lb": 125
        },
        "scope3": {
          "emissions": null,
          "unit": "tCO2e",
          "verified": "https://www.wikidata.org/wiki/Q123456",
          "categories": {
            "5_wasteGeneratedInOperations": 1234,
            "9_downstreamTransportationAndDistribution": 1234,
          }
        }
      }
    }
  }
}
\`\`\`


Please help me select the appropriate node id based on the wikidata search results below.
Prioritize the company with carbon footprint reporting (claim: P5991). Also prioritize swedish companies.
`

    const response = await ask(
      [
        {
          role: 'system',
          content: `I have a company named ${companyName}. I want to generate a wikidata query for it. Be helpful and try to be accurate.`,
        },
        { role: 'user', content: prompt },
        {
          role: 'assistant',
          content: 'OK. Just send me the wikidata search results?',
        },
        { role: 'user', content: JSON.stringify(results, null, 2) },
        { role: 'assistant', content: previousAnswer },
        { role: 'user', content: previousError },
      ].filter((m) => m.content?.length > 0) as any[]
    )

    job.log('Response: ' + response)

    const json = response.match(/```json([\s\S]*?)```/)?.[1] || response

    try {
      const parsedJson = json ? JSON.parse(json) : {} // we want to make sure it's valid JSON- otherwise we'll get an error which will trigger a new retry
      const wikidataId = parsedJson.wikidata?.node

      if (!wikidataId) {
        throw new Error(
          `Missing wikidataId for company with name "${companyName}"`
        )
      }

      saveCompany(wikidataId, '', {
        name: companyName,
        wikidataId,
        metadata: {
          comment: 'Updated from Garbo AI',
          source: url,
        },
      })
      extractEmissions.add(
        companyName,
        {
          ...job.data,
          companyName,
          wikidataId,
          paragraphs,
        },
        {
          attempts: 5,
        }
      )

      return JSON.stringify(parsedJson, null, 2)
    } catch (error) {
      await job.updateData({
        ...job.data,
        previousAnswer: response,
        previousError: error.message,
      })
      throw error
    }
  },
  {
    concurrency: 10,
    connection: redis,
  }
)

export default worker
