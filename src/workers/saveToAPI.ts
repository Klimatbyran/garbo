import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import discord from '../discord'
import apiConfig from '../config/api'
import { apiFetch } from '../lib/api'
import wikipediaUpload from './wikipediaUpload'
import { QUEUE_NAMES } from '../queues'

export interface SaveToApiJob extends DiscordJob {
  data: DiscordJob['data'] & {
    companyName?: string
    diff: string
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

export const saveToAPI = new DiscordWorker<SaveToApiJob>(
  QUEUE_NAMES.SAVE_TO_API,
  async (job: SaveToApiJob) => {
    try {
      const {
        companyName,
        wikidata,
        diff = '',
        apiSubEndpoint,
      } = job.data
      const wikidataId = wikidata.node

      // If approval is not required or already approved, proceed with saving
      if (job.isDataApproved()) {
        job.editMessage({
          content: `Thanks for approving ${apiSubEndpoint}`,
          components: [],
        })
      }      

      job.log(`approved: ${job.isDataApproved() ?? false}`)

      await job.sendMessage({
        content: `## ${apiSubEndpoint}\n\nNew changes for ${companyName}\n\n${diff}`,
      })

      if (job.isDataApproved()) {
        console.log(job.getApprovedBody());
        const sanitizedBody = removeNullValuesFromGarbo(job.getApprovedBody())

        job.log(`Saving approved data for ID:${wikidataId} company:${companyName} to API ${apiSubEndpoint}:
          ${JSON.stringify(sanitizedBody)}`)

        try {
          await apiFetch(`/companies/${wikidataId}/${apiSubEndpoint}`, {
            body: sanitizedBody
          })

          if(apiSubEndpoint === "reporting-periods") {
            await wikipediaUpload.queue.add("Wikipedia Upload for " + companyName,
              {
                ...job.data
              }
            )
          }

          return { success: true }
        } catch (apiError) {
          const errorMessage = `Failed to save data to API: ${apiError.message || 'Unknown error'}`;
          job.log(errorMessage);
          console.error(errorMessage, apiError);

          await job.sendMessage({
            content: `❌ Error: Failed to save ${apiSubEndpoint} data for ${companyName}. Server returned an error: ${apiError.message || 'Unknown error'}`
          });

          // Instead of returning a success=false object, throw the error to mark the job as failed
          throw apiError;
        }
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
      const errorMessage = `An error occurred during the save process: ${error.message || 'Unknown error'}`;
      job.log(errorMessage);

      try {
        await job.sendMessage({
          content: `❌ Error: Something went wrong while processing ${job.data.apiSubEndpoint} for ${job.data.companyName}: ${error.message || 'Unknown error'}`
        });
      } catch (msgError) {
        console.error('Failed to send error message:', msgError);
      }

      throw error
    }
  }
)

export default saveToAPI
