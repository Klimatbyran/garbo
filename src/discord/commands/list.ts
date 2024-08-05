import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js'
import elastic from '../../elastic'
import { summaryTable } from '../../lib/discordTable'

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
    list.forEach(async (report) => {
      const summary = await summaryTable(report)
      thread.send(`${report.companyName}
${summary}`) // TODO: add retry button
    })
  },
}
