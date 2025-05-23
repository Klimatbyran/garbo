
import { EntityId } from 'wikibase-sdk';
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker';
import { getLEINumberClaim } from '../lib/wikidata'; 
import { QUEUE_NAMES } from '../queues';

export class LEIJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string;
    wikidataId: string; 
    
  };
}


const extractLEI = new DiscordWorker<LEIJob>(
  QUEUE_NAMES.EXTRACT_LEI,
  async (job: LEIJob) => {
    const { wikidataId, companyName } = job.data;

    const lei = await getLEINumberClaim(wikidataId as EntityId);

    if (!lei) {
      job.log(`❌ Could not find a valid LEI for '${companyName}' in Wikidata.`);
      //throw new Error(`No LEI found for '${companyName}'.`);
    }
    job.log(`✅ Found LEI for '${companyName}': ${lei}`);
    return { lei: lei, wikidataId: wikidataId };
    
  }
);

export default extractLEI;

