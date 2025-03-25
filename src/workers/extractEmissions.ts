import { FlowProducer } from 'bullmq'
import redis from '../config/redis'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { JobType } from '../types'
import { QUEUE_NAMES } from '../queues'

class ExtractEmissionsJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    type: JobType
  }
}

const flow = new FlowProducer({ connection: redis })

const extractEmissions = new DiscordWorker<ExtractEmissionsJob>(
  QUEUE_NAMES.EXTRACT_EMISSIONS,
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
        {
          ...base,
          name: 'scope1+2 ' + companyName,
          data: {
            ...base.data,
            type: JobType.Scope12,
          },
        },
        {
          ...base,
          name: 'scope3 ' + companyName,
          data: {
            ...base.data,
            type: JobType.Scope3,
          },
        },
        {
          ...base,
          name: 'biogenic ' + companyName,
          data: {
            ...base.data,
            type: JobType.Biogenic,
          },
        },
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
          ...base,
          name: 'baseYear ' + companyName,
          data: {
            ...base.data,
            type: JobType.BaseYear,
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
