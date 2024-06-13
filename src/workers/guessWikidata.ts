import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { searchCompany } from '../lib/wikidata'
import { ask, askPrompt } from '../openai'

class JobData extends Job {
  declare data: {
    url: string
    companyName: string
    previousAnswer: string
    answer: string
    threadId: string
    previousError: string
  }
}

const worker = new Worker(
  'guessWikidata',
  async (job: JobData) => {
    const { previousError, previousAnswer, answer } = job.data
    const companyName = await askPrompt(
      'What is the name of the company? Respond only with the company name. We will search Wikidata after this name',
      answer
    )
    job.log('Searching for company name: ' + companyName)
    const results = await searchCompany(companyName)
    job.log('Results: ' + JSON.stringify(results, null, 2))

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
    "emissions": [
      {
        "year": "2019",
        "reference": "https://example.com/pdf.pdf",
        "scope1": {
          "emissions": 1234,
          "biogenic": 123,
          "unit": "tCO2e"
        },
        "scope2": {
          "emissions": 1235,
          "unit": "tCO2e",
          "mb": 1235,
          "lb": 125
        },
        "scope3": {
          "emissions": null,
          "unit": "tCO2e",
          "categories": {
            "1_purchasedGoods": 100000000,
            "2_capitalGoods": 100000000,
            "3_fuelAndEnergyRelatedActivities": 100000000,
            "4_upstreamTransportationAndDistribution": 100000000,
            "5_wasteGeneratedInOperations": 100000000,
            "6_businessTravel": 100000000,
            "7_employeeCommuting": 100000000,
            "8_upstreamLeasedAssets": 100000000,
            "9_downstreamTransportationAndDistribution": 100000000,
            "10_processingOfSoldProducts": 100000000,
            "11_useOfSoldProducts": 100000000,
            "12_endOfLifeTreatmentOfSoldProducts": 100000000,
            "13_downstreamLeasedAssets": 100000000,
            "14_franchises": 100000000,
            "15_investments": 100000000,
            "16_other": 100000000
          }
        }
      }
    ]
  }
}
\`\`\`
`

    const response = await ask(
      [
        {
          role: 'system',
          content: `I have a company named ${companyName}. I want to generate a wikidata query for it. Please help me select the appropriate node id based on the query below. I'll include the context from a PDF with the company's yearly report to help you select the correct one.`,
        },
        { role: 'user', content: JSON.stringify(results, null, 2) },
        { role: 'assistant', content: previousAnswer },
        { role: 'user', content: previousError },
        { role: 'user', content: prompt },
      ].filter((m) => m.content?.length > 0) as any[]
    )

    job.log('Response: ' + response)

    const json =
      response
        .match(/```json(.|\n)*```/)?.[0]
        ?.replace(/```json|```/g, '')
        .trim() || '{}'

    try {
      const parsedJson = json ? JSON.parse(json) : {} // we want to make sure it's valid JSON- otherwise we'll get an error which will trigger a new retry
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
    autorun: false,
  }
)

export default worker
