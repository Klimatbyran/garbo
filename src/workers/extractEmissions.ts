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
        scope12
          ? {
              name: 'saveScope12 ' + companyName,
              queueName: 'saveScope12',
              data: {
                ...base.data,
                scope12,
              },
            }
          : null,
        scope3
          ? {
              name: 'saveScope3 ' + companyName,
              queueName: 'saveScope3',
              data: {
                ...base.data,
                scope3,
              },
            }
          : null,
        biogenic
          ? {
              name: 'saveBiogenic ' + companyName,
              queueName: 'saveBiogenic',
              data: {
                ...base.data,
                biogenic,
              },
            }
          : null,
        {
          ...base,
          name: 'economy ' + companyName,
          data: {
            ...base.data,
            type: JobType.Economy,
          },
        },
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
