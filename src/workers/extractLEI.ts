
import { EntityId } from 'wikibase-sdk';
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker';
import { getLEINumberClaim } from '../lib/wikidata'; 
import { QUEUE_NAMES } from '../queues';
import { getLEINumbers } from '../lib/gleif';
import { ask } from '../lib/openai';
import { leiPrompt, leiSchema } from '../prompts/lei';

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
      
      const searchResults = await getLEINumbers(companyName);

      job.log('Results: ' + JSON.stringify(searchResults, null, 2));
      if (searchResults.length === 0) {
        await job.sendMessage(`❌ Did not find any LEI number for: ${companyName}.`);
        throw new Error(`No LEI number for "${companyName}"`);
      }

      const response = await ask(
        [
          {
            role: 'system',
            content: `I have a company named ${companyName} and I am looking for the wikidata entry related to this company. Be helpful and try to be accurate.`,
          },
          { role: 'user', content: leiPrompt },
          {
            role: 'assistant',
            content: 'OK. Just send me the wikidata search results?',
          },
          {
            role: 'user',
            content: JSON.stringify(searchResults, null, 2),
          },
          Array.isArray(job.stacktrace)
            ? { role: 'user', content: job.stacktrace.join('\n') }
            : undefined,
        ].filter((m) => m && m.content?.length > 0) as ChatCompletionMessageParam[],
        {response_format: zodResponseFormat(leiSchema, 'lei')}
      )

      job.log('Response: ' + response)

      const { success, error, data } = leiSchema.safeParse(
        JSON.parse(response)
      )

      if (error || !success) {
        throw new Error('Failed to parse ' + error.message)
      }

      return { lei: data.lei, wikidataId: wikidataId };

    }
    job.log(`✅ Found LEI for '${companyName}': ${lei}`);
    return { lei: lei, wikidataId: wikidataId };
    
  }
);

export default extractLEI;

