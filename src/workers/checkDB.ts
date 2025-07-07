import { FlowProducer } from 'bullmq'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { apiFetch } from '../lib/api'
import redis from '../config/redis'
import { getCompanyURL } from '../lib/saveUtils'
import { QUEUE_NAMES } from '../queues'

export class CheckDBJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: { node: string }
    fiscalYear: {
      startMonth: number,
      endMonth: number,
    },
    approved?: boolean
    lei?: string
  }
}

const flow = new FlowProducer({ connection: redis })

const checkDB = new DiscordWorker(
  QUEUE_NAMES.CHECK_DB, 
  async (job: CheckDBJob) => {
    const {
      companyName,
      url,
      fiscalYear,
      wikidata,
      threadId,
      channelId,
      
    } = job.data
  
    const {
      scope12,
      scope3,
      biogenic,
      industry,
      economy,
      baseYear,
      goals,
      initiatives,
      descriptions,
      lei,
    } = await job.getChildrenEntries()
  
    job.sendMessage(`🤖 Checking if ${companyName} already exists in API...`)
    const wikidataId = wikidata.node
    const existingCompany = await apiFetch(`/companies/${wikidataId}`).catch(
      () => null
    )
    job.log(existingCompany);
  
    if (!existingCompany) {
      const metadata = {
        source: url,
        comment: 'Created by Garbo AI',
      }
  
      job.sendMessage(
        `🤖 No previous data found for  ${companyName} (${wikidataId}). Creating..`
      )
      const body = {
        name: companyName,
        wikidataId,
        metadata,
      }
  
      await apiFetch(`/companies/${wikidataId}`, { body });
  
      await job.sendMessage(
        `✅ The company '${companyName}' has been created! See the result here: ${getCompanyURL(companyName, wikidataId)}`
      );
    } else {
      job.log(`✅ The company '${companyName}' was found in the database.`);
      await job.sendMessage(`✅ The company '${companyName}' was found in the database, with LEI number '${existingCompany.lei} || null'`);
    }
  
    const base = {
      name: companyName,
      data: {
        existingCompany,
        companyName,
        url,
        fiscalYear,
        wikidata,
        threadId,
        channelId,
        autoApprove: job.data.autoApprove,
      },
      opts: {
        attempts: 3,
      },
    }

    await job.editMessage(`🤖 Saving data...`)
  
    await flow.add({
      ...base,
      queueName: QUEUE_NAMES.SEND_COMPANY_LINK,
      data: {
        ...base.data,
      },
      children: [
        scope12 || scope3 || biogenic || economy
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_REPORTING_PERIODS,
              data: {
                ...base.data,
                scope12,
                scope3,
                biogenic,
                economy,
              },
            }
          : null,
        industry
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_INDUSTRY,
              data: {
                ...base.data,
                industry,
              },
            }
          : null,
        goals
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_GOALS,
              data: {
                ...base.data,
                goals,
              },
            }
          : null,
        baseYear
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_BASE_YEAR,
              data: {
                ...base.data,
                baseYear,
              },
            }
          : null,
        initiatives
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_INITIATIVES,
              data: {
                ...base.data,
                initiatives,
              },
            }
          : null,
        lei
          ? {
              ...base,
              queueName: QUEUE_NAMES.DIFF_LEI,
              data: {
                ...base.data,
                lei,
                   
              },
            }
          : null,
        descriptions
          ? {
              name: 'diffDescriptions' + companyName,
              queueName: QUEUE_NAMES.DIFF_DESCRIPTIONS,
              data: {
                ...job.data,
                fiscalYear: undefined,
                wikidataId: wikidataId,
                existingDescriptions: existingCompany?.descriptions,
                descriptions: descriptions,
              },
            }
          : null,
      ].filter((e) => e !== null),
    })
  
    return { saved: true }
  }
)

export default checkDB
