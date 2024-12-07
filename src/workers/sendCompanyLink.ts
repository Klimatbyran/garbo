import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'

export class SendCompanyLinkJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName: string
    wikidata: any
  }
}

const frontendBaseURL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:4321'
    : 'https://beta.klimatkollen.se'

const sendCompanyLink = new DiscordWorker<SendCompanyLinkJob>(
  'sendCompanyLink',
  async (job) => {
    const { companyName, wikidata } = job.data
    const wikidataId = wikidata.node

    // Create URL-safe company name
    const urlSafeCompanyName = companyName
      .toLowerCase()
      .replace(/[åä]/g, 'a')
      .replace(/[ö]/g, 'o')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    const url = `${frontendBaseURL}/foretag/${urlSafeCompanyName}-${wikidataId}`

    await job.sendMessage(`✅ Företaget har sparats! Se resultatet här: ${url}`)

    return { url }
  }
)

export default sendCompanyLink
