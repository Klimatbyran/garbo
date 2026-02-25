import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { apiFetch } from '../lib/api'
import { QUEUE_NAMES } from '../queues'

export interface SaveToApiJob extends DiscordJob {
  data: DiscordJob['data'] & {
    companyName?: string
    body: any
    wikidata: { node: string }
    apiSubEndpoint: string
  }
}

function removeNullValuesFromGarbo(
  data: any,
  preserveNullsInEmissions: boolean = false
): any {
  if (Array.isArray(data)) {
    const mapped = data.map((item) =>
      removeNullValuesFromGarbo(item, preserveNullsInEmissions)
    )

    //filtering out undefined values from arrays, but not nulls, if we are preserving nulls in emissions:
    return preserveNullsInEmissions
      ? mapped.filter((item) => item !== undefined)
      : mapped.filter((item) => item !== null && item !== undefined)
  } else if (typeof data === 'object' && data !== null) {
    const sanitizedObject = Object.entries(data).reduce(
      (acc, [key, value]) => {
        // For the emissions subtree, we preserve nulls and only remove undefined values
        if (key === 'emissions' && value && typeof value === 'object') {
          acc[key] = removeNullValuesFromGarbo(value, true)
          return acc
        }

        const sanitizedValue = removeNullValuesFromGarbo(
          value,
          preserveNullsInEmissions
        )
        //when working our way 'back up' from the bottom of the tree, we preserve children values that still have a null or a value.
        if (preserveNullsInEmissions) {
          if (sanitizedValue !== undefined) acc[key] = sanitizedValue
        } else {
          if (sanitizedValue !== null && sanitizedValue !== undefined)
            acc[key] = sanitizedValue
        }
        return acc
      },
      {} as Record<string, any>
    )

    if (preserveNullsInEmissions) {
      // In emissions subtree we never collapse empty objects to null
      return sanitizedObject
    }
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

      // remove all null values except for emissions where we want them to be explicit
      const sanitizedBody = removeNullValuesFromGarbo(body)

      // Coerce emissions.scope3: null -> {} so API accepts "explicitly none this year"
      const coerceNullScope3ToEmptyObject = (emissions?: any) => {
        if (!emissions || typeof emissions !== 'object') return
        if (emissions.scope3 === null) emissions.scope3 = {}
      }

      if (Array.isArray(sanitizedBody?.reportingPeriods)) {
        for (const rp of sanitizedBody.reportingPeriods) {
          coerceNullScope3ToEmptyObject(rp.emissions)
        }
      }

      job.log(`Saving approved data for ID:${wikidataId} company:${companyName} to API ${apiSubEndpoint}:
          ${JSON.stringify(sanitizedBody)}`)

      const result = await apiFetch(
        `/companies/${wikidataId}/${apiSubEndpoint}`,
        {
          body: sanitizedBody,
        }
      )

      if (result === null) {
        throw new Error(
          `API endpoint not found: /companies/${wikidataId}/${apiSubEndpoint}`
        )
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
  },
)

export default saveToAPI
