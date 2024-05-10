import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js'
import elastic from '../../elastic'
import { summaryTable } from '../../lib/discordTable'
import { CompanyData } from '../../models/companyEmissions'
import { compareFacitToCompanyData, findFacit } from '../../lib/facit'

export default {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('Ta fram en lista på alla godkända rapporter.'),

  async execute(interaction: ChatInputCommandInteraction) {
    const thread = await (interaction.channel as TextChannel).threads.create({
      name: 'List of all approved reports',
      autoArchiveDuration: 1440,
    })

    const list = await elastic.getAllLatestApprovedReports()
    await Promise.all(
      list.map(async (report) => {
        const company = {
          ...report,
          emissions: Object.values(report.emissions),
        } as CompanyData
        const summary = await summaryTable(company)

        return thread.send({
          content: `${report.companyName}
\`\`\`
${summary}
\`\`\`
`,
          components: [], // TODO: add retry button
        })
      })
    )
  },
}
