import { FlowProducer } from 'bullmq'
import redis from '../config/redis'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { JobType } from '../types'

class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    type: JobType
  }
}

const flow = new FlowProducer({ connection: redis })

const extractEmissions = new DiscordWorker<JobData>(
  'extractEmissions',
  async (job) => {
    const { companyName } = job.data
    job.sendMessage(`🤖 Hämtar utsläppsdata...`)

    const childrenValues = await job.getChildrenEntries()

    const base = {
      name: companyName,
      data: { ...job.data, ...childrenValues },
      queueName: 'followUp',
      opts: {
        attempts: 3,
      },
    }

    await flow.add({
      name: companyName,
      queueName: 'checkDB',
      data: {
        ...base.data,
      },
      children: [
        {
          ...base,
          name: 'industryGics ' + companyName,
          data: {
            ...base.data,
            type: JobType.IndustryGics,
          },
        },
        (scope12 || scope3 || biogenic || economy)
          ? {
              name: 'saveReportingPeriods ' + companyName,
              queueName: 'saveReportingPeriods',
              data: {
                ...base.data,
                scope12,
                scope3,
                biogenic,
                economy,
              },
            }
          : null,
        {
          ...base,
          name: 'goals ' + companyName,
          data: {
            ...base.data,
            apiSubEndpoint: 'goals',
            type: JobType.Goals,
          },
        },
        {
          ...base,
          name: 'initiatives ' + companyName,
          data: {
            ...base.data,
            type: JobType.Initiatives,
          },
        },
        {
          name: 'askDiff ' + companyName,
          queueName: 'askDiff',
          data: {
            ...base.data,
          },
        },
      ],
      opts: {
        attempts: 3,
      },
    })

    job.sendMessage(`🤖 Ställer följdfrågor...`)
    return true
  }
)

export default extractEmissions
