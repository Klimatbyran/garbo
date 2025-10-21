import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { generateWikipediaArticleText, updateWikipediaContent } from '../lib/wikipedia'
import { ReportingPeriod, Emissions } from '../lib/emissions'
import wikipediaConfig from '../config/wikipedia'
import { QUEUE_NAMES } from '../queues'
import { getWikipediaTitle } from '@/lib/wikidata/read'

export class WikipediaUploadJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    wikidata: { node: `Q${number}` }
    body: {
      reportingPeriods: ReportingPeriod[]
    }
  }
}

const checkEmissionsExist = (emissions: Emissions): boolean => {
  return (
    emissions.scope1?.total !== undefined ||
    emissions.scope2?.mb !== undefined ||
    emissions.scope2?.lb !== undefined ||
    emissions.scope3?.statedTotalEmissions?.total !== undefined ||
    emissions.scope3?.categories?.length !== undefined
  )
}

const wikipediaUpload = new DiscordWorker<WikipediaUploadJob>(
  QUEUE_NAMES.WIKIPEDIA_UPLOAD,
  async (job) => {
    const {
      wikidata,
      body
    } = job.data

    const reportingPeriod = findMostRecentReportingPeriod(body.reportingPeriods);

    if(!reportingPeriod) {
      job.editMessage(`❌ Can't upload to wikipedia no reporting period found`);
      console.error('No reporting period found');
      throw Error('No reporting period found');
    }
    const year: string = reportingPeriod.startDate.split('-')[0]
    const emissions: Emissions = reportingPeriod.emissions
    const title: string = await getWikipediaTitle(wikidata.node)

    if (!checkEmissionsExist(emissions)) {
      job.editMessage(`❌ No emissions found`)
      console.error('No emissions found')
      throw Error('No emissions found')
    }

    if (!title) {
      job.editMessage(`❌ No Wikipedia page found`)
      console.error('No Wikipedia page found')
      throw Error('No Wikipedia page found')
    }

    const text: string = generateWikipediaArticleText(emissions, title, year, wikipediaConfig.language)
    const reportURL: string = reportingPeriod.reportURL;
    const content = {
      text,
      reportURL
    }

    try {
      if(title) {
        await updateWikipediaContent(title, content)
      }
    } catch(e) {
      job.editMessage(`❌ Error updating Wikipedia: ${e.message}`)
      throw e
    }

    return { success: true }
  }
)

function findMostRecentReportingPeriod(reportingPeriods: ReportingPeriod[] = []) {
  if (reportingPeriods.length === 0) {
    return null;
  }

  reportingPeriods.sort((a, b) => {
    const dateA = new Date(a.endDate);
    const dateB = new Date(b.endDate);
    return dateB.getTime() - dateA.getTime();
  });

  return reportingPeriods[0];
}

export default wikipediaUpload