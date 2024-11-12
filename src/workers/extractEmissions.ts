import { FlowProducer } from 'bullmq'
import { zodResponseFormat } from 'openai/helpers/zod'
import redis from '../config/redis'
import industryGics from '../prompts/followUp/industry_gics'
import scope12 from '../prompts/followUp/scope12'
import scope3 from '../prompts/followUp/scope3'
import goals from '../prompts/followUp/goals'
import initiatives from '../prompts/followUp/initiatives'
import baseFacts from '../prompts/followUp/baseFacts'
import fiscalYear from '../prompts/followUp/fiscalYear'
import equality from '../prompts/followUp/equality'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'

class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
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
            prompt: industryGics.prompt,
            schema: zodResponseFormat(industryGics.schema, 'industry'),
          },
        },
        {
          ...base,
          name: 'scope1+2 ' + companyName,
          data: {
            ...base.data,
            prompt: scope12.prompt,
            schema: zodResponseFormat(scope12.schema, 'emissions_scope12'),
          },
        },
        {
          ...base,
          name: 'scope3 ' + companyName,
          data: {
            ...base.data,
            prompt: scope3.prompt,
            schema: zodResponseFormat(scope3.schema, 'emissions_scope3'),
          },
        },

        /*
      
      {
        ...base,
        name: 'goals ' + companyName,
        data: {
          ...base.data,
          apiSubEndpoint: 'goals',
          prompt: goals.prompt,
          schema: zodResponseFormat(goals.schema, 'goals'),
        },
      },
      {
        ...base,
        name: 'initiatives ' + companyName,
        data: {
          ...base.data,
          apiSubEndpoint: 'initiatives',
          prompt: initiatives.prompt,
          schema: zodResponseFormat(initiatives.schema, 'initiatives'),
        },
      },
      {
        ...base,
        name: 'baseFacts ' + companyName,
        data: {
          ...base.data,
          apiSubEndpoint: 'economy',
          prompt: baseFacts.prompt,
          schema: zodResponseFormat(baseFacts.schema, 'baseFacts'),
        },
      }*/
      ],
      opts: {
        attempts: 3,
      },
    })

    job.sendMessage(`🤖 Ställer följdfrågor...`)
  }
)

export default extractEmissions
