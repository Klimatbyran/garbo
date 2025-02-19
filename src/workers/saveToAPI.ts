import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import discord from '../discord'
import apiConfig from '../config/api'
import { apiFetch } from '../lib/api'

export interface SaveToApiJob extends DiscordJob {
  data: DiscordJob['data'] & {
    approved?: boolean
    requiresApproval: boolean
    diff: string
    body: any
    wikidata: { node: string }
    apiSubEndpoint: string
  }
}

export const saveToAPI = new DiscordWorker<SaveToApiJob>(
  'saveToAPI',
  async (job: SaveToApiJob) => {
    try {
      const {
        wikidata,
        approved,
        requiresApproval = true,
        diff = '',
        body,
        apiSubEndpoint,
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

      if (!requiresApproval || approved) {
        console.log(`Saving approved data for ${wikidataId} to API`)
        await apiFetch(`/companies/${wikidataId}/${apiSubEndpoint}`, {
          body: removeNullValuesFromGarbo(body),
        })

        // After successful save of emissions data, trigger assessment
        if (apiSubEndpoint === 'reporting-periods') {
          await job.queue.add('emissionsAssessment', {
            ...job.data,
            scope12: body.reportingPeriods?.[0]?.emissions?.scope1 && body.reportingPeriods?.[0]?.emissions?.scope2 
              ? [{ 
                  year: body.reportingPeriods[0].year,
                  scope1: body.reportingPeriods[0].emissions.scope1,
                  scope2: body.reportingPeriods[0].emissions.scope2
                }]
              : undefined,
            scope3: body.reportingPeriods?.[0]?.emissions?.scope3
              ? [{ 
                  year: body.reportingPeriods[0].year,
                  scope3: body.reportingPeriods[0].emissions.scope3
                }]
              : undefined,
            biogenic: body.reportingPeriods?.[0]?.emissions?.biogenic
              ? [{
                  year: body.reportingPeriods[0].year,
                  biogenic: body.reportingPeriods[0].emissions.biogenic
                }]
              : undefined
          })
        }

        return { success: true }
      }

      // If approval is required and not yet approved, send approval request
      const buttonRow = discord.createApproveButtonRow(job)

      await job.sendMessage({
        content: `## ${apiSubEndpoint}\n\nNew changes need approval for ${wikidataId}\n\n${diff}`,
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
