import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker';
import wikidata from '../prompts/wikidata';
import { QUEUE_NAMES } from '../queues';
import saveToAPI from './saveToAPI';

export class DiffLeiJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string;          
    lei: string | null | undefined; // Switching to lei
    existingCompany: any;               
    wikidata: { node: string };   
    
  };
}

function compareLei(
  existingLei?: string,
  lei: string | null | undefined
): {
  shouldUpdate: boolean; 
  reason: string; 
} {
  
  if (!existingLei ||existingLei.trim() === '') {
    return {
      shouldUpdate: true,
       
      reason: `No existing LEI. New LEI '${lei}' will be set.`,
    };
  }

  if (existingLei === lei) {
    return {
      shouldUpdate: false,
      reason: `Current LEI '${existingLei}' is already correct. No changes needed.`,
    };
  }

  return {
    shouldUpdate: true,
    reason: `Current LEI '${existingLei}' differs from New LEI '${lei}'. An update is required.`,
  };
}

const diffLei = new DiscordWorker<DiffLeiJob>(
  QUEUE_NAMES.DIFF_LEI, 
  async (job: DiffLeiJob) => {
    const { companyName, lei, existingCompany } = job.data;  

    const currentLei  = existingCompany?.lei; 


    job.log(`🔍 Comparing LEI for '${companyName}': \nCurrent LEI: '${currentLei}'\nNew LEI: '${lei}'`); 

    const comparisonResult = compareLei(currentLei, lei ); 

    if (!comparisonResult.shouldUpdate) {
      job.log(`✅ No changes detected for '${companyName}'. Current LEI is already correct.`);
      return; 
    }

    const body = {
      lei: lei,
      wikidataId: job.data.wikidata.node,
      name: companyName,
    };

    job.log(`⚡ Detected changes for '${companyName}', enqueuing save operation...`);
    await saveToAPI.queue.add(`${companyName} - LEI Update`, {
      ...job.data,
      body : body, 
      diff: comparisonResult.reason, 
      requiresApproval: false, 
      apiSubEndpoint: '',
    });
   
    job.log(`✅ Enqueued LEI update for '${companyName}' with LEI: '${lei}'.`); 

  }
);

export default diffLei;
