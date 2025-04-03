import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import discord from '../discord'
import apiConfig from '../config/api'
import { apiFetch } from '../lib/api'
import wikipediaUpload from './wikipediaUpload'
import { QUEUE_NAMES } from '../queues'
import wikidataUpload from './wikidataUpload'

export interface SaveToApiJob extends DiscordJob {
  data: DiscordJob['data'] & {
    companyName?: string
    approved?: boolean
    requiresApproval: boolean
    diff: string
    body: any
    wikidata: { node: string }
    apiSubEndpoint: string
  }
}

export const saveToAPI = new DiscordWorker<SaveToApiJob>(
  QUEUE_NAMES.SAVE_TO_API,
  async (job: SaveToApiJob) => {
    try {
      const {
        companyName,
        wikidata,
        approved = false,
        requiresApproval = true,
        diff = '',
        body,
        apiSubEndpoint,
        autoApprove = false,
      } = job.data
      const wikidataId = wikidata.node

      // If approval is not required or already approved, proceed with saving
      if (approved) {
        job.editMessage({
          content: `Thanks for approving ${apiSubEndpoint}`,
          components: [],
        })
      }

      function removeNullValuesFromGarbo(data: any): any {
        if (Array.isArray(data)) {
          return data
            .map((item) => removeNullValuesFromGarbo(item))
            .filter((item) => item !== null && item !== undefined)
        } else if (typeof data === 'object' && data !== null) {
          const sanitizedObject = Object.entries(data).reduce(
            (acc, [key, value]) => {
              const sanitizedValue = removeNullValuesFromGarbo(value)
              if (sanitizedValue !== null && sanitizedValue !== undefined) {
                acc[key] = sanitizedValue
              }
              return acc
            },
            {} as Record<string, any>
          )

          return Object.keys(sanitizedObject).length > 0
            ? sanitizedObject
            : null
        } else {
          return data
        }
      }
      
      job.log(`autoApprove: ${autoApprove}, requiresApproval: ${requiresApproval}, approved: ${approved}`)
      
      await job.sendMessage({
        content: `## ${apiSubEndpoint}\n\nNew changes for ${companyName}\n\n${diff}`,
      })
      
      if (autoApprove || !requiresApproval || approved) { 
        const sanitizedBody = removeNullValuesFromGarbo(body)
        
        job.log(`Saving approved data for ID:${wikidataId} company:${companyName} to API ${apiSubEndpoint}:
          ${JSON.stringify(sanitizedBody)}`)
        
        await apiFetch(`/companies/${wikidataId}/${apiSubEndpoint}`, {
          body: sanitizedBody
        })
        
        if(apiSubEndpoint === "reporting-periods") {
          await wikipediaUpload.queue.add("Wikipedia Upload for " + companyName,
            {
              ...job.data
            }
          )
          await wikidataUpload.queue.add("Wikidata Upload for " + companyName,
            {
              ...job.data
            }
          )
        }
        
        return { success: true }
      }
      
      job.log("The data needs approval before saving to API.")

      // If approval is required and not yet approved, send approval request
      const buttonRow = discord.createApproveButtonRow(job)

      await job.editMessage({
        components: [buttonRow],
      })

      return await job.moveToDelayed(Date.now() + apiConfig.jobDelay)
    } catch (error) {
      console.error('API Save error:', error)
      throw error
    }
  }
)

export default saveToAPI
