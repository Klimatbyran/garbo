import { askPrompt } from '../lib/openai'
import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { vectorDB } from '../lib/vectordb'
import { QUEUE_NAMES } from '../queues'
import {Description} from '../api/types'


class ExtractDescriptionsJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string,
    companyId: string,
  }
}

const extractDescriptions = new DiscordWorker<ExtractDescriptionsJob>(
  QUEUE_NAMES.EXTRACT_DESCRIPTIONS,
  async (job: ExtractDescriptionsJob) => {
    const { url, companyName } = job.data;


    // Helps in finding relevant chuncks to extract the corresponding paragraphs 
    const queryTexts = [
      'Summarize the company\'s primary industry, activities, and goals.',
      'Describe the main operations and products of the company.',
      'Provide a summary of what the company does and its target market.'
    ]

    const markdown = await vectorDB.getRelevantMarkdown(url, queryTexts, 15)

    const descriptionSWE = await askPrompt(
      `Du är en torr revisor som ska skriva en kort, objektiv beskrivning av företagets verksamhet.
  
      ** Beskrivning **
      Följ dessa riktlinjer:
      
      1. Längd: Beskrivningen får inte överstiga 300 tecken, inklusive mellanslag.
      2. Syfte: Endast företagets verksamhet ska beskrivas. Använd ett extra sakligt och neutralt språk.
      3. Förbjudet innehåll (marknadsföring): VIKTIGT! Undvik ord som "ledande", "i framkant", "marknadsledare", "innovativt", "värdefull", "framgångsrik" eller liknande. Texten får INTE innehålla formuleringar som uppfattas som marknadsföring eller säljande språk.
      4. Förbjudet innehåll (hållbarhet): VIKTIGT! Undvik ord som "hållbarhet", "klimat" eller liknande. Texten får INTE innehålla bedömningar av företagets hållbarhetsarbete.
      5. Språk: VIKTIGT! Beskrivningen ska ENDAST vara på svenska. Om originaltexten är på engelska, översätt till svenska.
      
      För att säkerställa att svaret följer riktlinjerna, tänk på att:
      
      - Använd ett sakligt och neutralt språk.
      - Aldrig använda marknadsförande eller värderande språk.
      - Tydligt beskriva företagets verksamhet.
      
      Svara endast med företagets beskrivning. Lägg inte till andra instruktioner eller kommentarer.
      
      Exempel på svar: "AAK är ett företag som specialiserar sig på växtbaserade oljelösningar. Företaget erbjuder ett brett utbud av produkter och tjänster inom livsmedelsindustrin, inklusive specialfetter för choklad och konfektyr, mejeriprodukter, bageri och andra livsmedelsapplikationer."
      
      Följande är ett utdrag ur en PDF:`,
      markdown.substring(0, 5000)
    )

    const descriptionENG = await askPrompt(
      `Översätt följande text till engelska.`,
      descriptionSWE
    )

    const descriptions: Description[] = [{language: 'SV', text: descriptionSWE}, {language: 'EN', text: descriptionENG}]

    job.log(`For '${companyName}', created the following descriptions: ${descriptions}`);

    return {descriptions: descriptions}
  }
)

export default extractDescriptions
