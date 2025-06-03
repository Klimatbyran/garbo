import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { apiFetch } from '../lib/api'
import wikipediaUpload from './wikipediaUpload'
import { QUEUE_NAMES } from '../queues'

export interface SaveToApiJob extends DiscordJob {
  data: DiscordJob['data'] & {
    companyName?: string
    body: any
    wikidata: { node: string }
    apiSubEndpoint: string
  }
}

function removeNullValuesFromGarbo(data: any): any {
  if (Array.isArray(data)) {
    return data
      .map((item) => removeNullValuesFromGarbo(item))
      .filter((item) => item !== null && item !== undefined)
  } else if (typeof data === 'object' && data !== null) {
    const sanitizedObject = Object.entries(data).reduce((acc, [key, value]) => {
      const sanitizedValue = removeNullValuesFromGarbo(value)
      if (sanitizedValue !== null && sanitizedValue !== undefined) {
        acc[key] = sanitizedValue
      }
      return acc
    }, {} as Record<string, any>)

    return Object.keys(sanitizedObject).length > 0 ? sanitizedObject : null
  } else {
    return data
  }
}

export const saveToAPI = new DiscordWorker<SaveToApiJob>(
  QUEUE_NAMES.SAVE_TO_API,
  async (job: SaveToApiJob) => {
    try {
      const { companyName, wikidata, body, apiSubEndpoint } = job.data
      const wikidataId = wikidata.node

      console.log(body)
      const sanitizedBody = removeNullValuesFromGarbo(body)

      job.log(`Saving approved data for ID:${wikidataId} company:${companyName} to API ${apiSubEndpoint}:
          ${JSON.stringify(sanitizedBody)}`)

      await apiFetch(`/companies/${wikidataId}/${apiSubEndpoint}`, {
        body: sanitizedBody,
      })

      if (apiSubEndpoint === 'reporting-periods') {
        await wikipediaUpload.queue.add('Wikipedia Upload for ' + companyName, {
          ...job.data,
        })
      }

      return { success: true }
    } catch (error) {
      console.error('API Save error:', error)
      const errorMessage = `An error occurred during the save process: ${
        error.message || 'Unknown error'
      }`
      job.log(errorMessage)

      try {
        await job.sendMessage({
          content: `❌ Error: Something went wrong while processing ${
            job.data.apiSubEndpoint
          } for ${job.data.companyName}: ${error.message || 'Unknown error'}`,
        })
      } catch (msgError) {
        console.error('Failed to send error message:', msgError)
      }

      throw error
    }
  }
)

export default saveToAPI
