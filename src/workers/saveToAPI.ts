import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import discord from '../discord'
import apiConfig from '../config/api'
import { apiFetch } from '../lib/api'
import wikipediaUpload from './wikipediaUpload'

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
  'saveToAPI',
  async (job: SaveToApiJob) => {
    try {
      const {
        companyName,
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
        if(apiSubEndpoint === "reporting-periods") {
          await wikipediaUpload.queue.add("Wikipedia Upload for " + companyName,
            {
              ...job.data
            }
          )
        }
        console.log(`Saving approved data for ${wikidataId} to API`)
        await apiFetch(`/companies/${wikidataId}/${apiSubEndpoint}`, {
          body: removeNullValuesFromGarbo(body),
        })

        // After successful save and approval of emissions data, trigger assessment
        if (apiSubEndpoint === 'reporting-periods' && (approved || !requiresApproval)) {
          const flow = new FlowProducer({ connection: redis })
          
          const reportingPeriod = body.reportingPeriods?.[0]
          if (reportingPeriod?.emissions) {
            const assessmentData = {
              scope12: reportingPeriod.emissions.scope1 && reportingPeriod.emissions.scope2 
                ? [{ 
                    year: reportingPeriod.year,
                    scope1: reportingPeriod.emissions.scope1,
                    scope2: reportingPeriod.emissions.scope2
                  }]
                : undefined,
              scope3: reportingPeriod.emissions.scope3
                ? [{ 
                    year: reportingPeriod.year,
                    scope3: reportingPeriod.emissions.scope3
                  }]
                : undefined,
              biogenic: reportingPeriod.emissions.biogenic
                ? [{
                    year: reportingPeriod.year,
                    biogenic: reportingPeriod.emissions.biogenic
                  }]
                : undefined
            }

            await flow.add({
              name: `emissionsAssessment-${job.data.companyName}`,
              queueName: 'emissionsAssessment',
              data: {
                ...job.data,
                ...assessmentData
              },
              children: [
                {
                  name: `verifyScope3-${job.data.companyName}`,
                  queueName: 'verifyScope3',
                  data: {
                    ...job.data,
                    ...assessmentData
                  }
                },
                {
                  name: `verifyCalculations-${job.data.companyName}`,
                  queueName: 'verifyCalculations', 
                  data: {
                    ...job.data,
                    ...assessmentData
                  }
                }
              ]
            })
          }
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
