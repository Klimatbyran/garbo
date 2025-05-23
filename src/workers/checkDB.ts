import { FlowProducer } from 'bullmq'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { apiFetch } from '../lib/api'
import redis from '../config/redis'
import { getCompanyURL } from '../lib/saveUtils'
import { QUEUE_NAMES } from '../queues'

export class CheckDBJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    description?: string
    wikidata: { node: string }
    fiscalYear: {
      startMonth: number,
      endMonth: number,
    },
    childrenValues?: any
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
      description,
      url,
      fiscalYear,
      wikidata,
      threadId,
      channelId,
      
      
    } = job.data
  
    const childrenValues = await job.getChildrenEntries()
    await job.updateData({ ...job.data, childrenValues })
  
    job.sendMessage(`🤖 kontrollerar om ${companyName} finns i API...`)
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
        `🤖 Ingen tidigare data hittad för ${companyName} (${wikidataId}). Skapar...`
      )
      const body = {
        name: companyName,
        description,
        wikidataId, 
        metadata,
      }
  
      await apiFetch(`/companies/${wikidataId}`, { body }); 

      await job.sendMessage(
        `✅ Företaget '${companyName}' har skapats! Se resultatet här: ${getCompanyURL(companyName, wikidataId)}`
      );
    } else {
      job.log(`✅ Företaget '${companyName}' hittades i databasen.`);
      await job.sendMessage(`✅ Företaget '${companyName}' hittades i vår databas, med LEI '${existingCompany.lei} || null'`);
    }

    
    const {
      scope12,
      scope3,
      biogenic,
      industry,
      economy,
      baseYear,
      goals,
      initiatives,
      lei,
    } = childrenValues
  
    const base = {
      name: companyName,
      data: {
        existingCompany,
        companyName,
        description,
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
    
    console.log(`LEI number in checkDB file: ${lei}`);

    await job.editMessage(`🤖 Sparar data...`)
  
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
          
      ].filter((e) => e !== null),
    })
  
    return { saved: true }
  }
)

export default checkDB
