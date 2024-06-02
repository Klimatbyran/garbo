import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js'
import opensearch from '../../opensearch'
import { summaryTable } from '../../lib/discordTable'
import { CompanyData } from '../../models/companyEmissions'
import { compareFacitToCompanyData, findFacit } from '../../lib/facit'
import { discordReview, saveToDb } from '../../queues'

export default {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('Ta fram en lista på alla godkända rapporter.'),

  async execute(interaction: ChatInputCommandInteraction) {
    const list = await opensearch.getAllLatestApprovedReports()
    if (list === null)
      return interaction.reply('Inga godkända rapporter hittades.')

    const jobsFinished = discordReview.getCompleted()

    const thread = await (interaction.channel as TextChannel).threads.create({
      name: `List of ${list?.length} approved reports`,
      autoArchiveDuration: 1440,
    })

    await Promise.all(
      list.map(async (report) => {
        const company = {
          ...report,
          emissions: Object.values(report.emissions),
        } as CompanyData
        const summary = await summaryTable(company)
        let row = null
        const job =
          report.id &&
          (await jobsFinished).find((j) => j.data?.pdfHash === report.id)
        if (job) {
          row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`retry~${job.id}`)
              .setLabel('Retry')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(`feedback~${job.id}`)
              .setLabel('Feedback')
              .setStyle(ButtonStyle.Primary)
          )
        }

        return thread.send({
          content: `${report.companyName}
\`\`\`
${summary}
\`\`\`
`,
          components: row ? [row] : [], // TODO: add retry button
        })
      })
    )

    await thread.send({
      content: `Summering: ${list.length} godkända.`,
    })
  },
}
