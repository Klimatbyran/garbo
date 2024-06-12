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
import {
  compareFacitToCompanyData,
  findFacit,
  getAllCompanies,
} from '../../lib/facit'
import { discordReview, downloadPDF, saveToDb } from '../../queues'

export default {
  data: new SlashCommandBuilder()
    .setName('all')
    .setDescription('Starta en körning för alla rapporter i facit.'),

  async execute(interaction: ChatInputCommandInteraction) {
    const list = await getAllCompanies()
    if (list === null || list.length === 0)
      return interaction.reply('Inga rapporter hittades i facit.')

    const thread = await (interaction.channel as TextChannel).threads.create({
      name: `List of ${list.length} reports`,
    })

    await downloadPDF.addBulk(
      list.map((company) => ({
        name: company.companyName,
        data: {
          url: company.url,
          threadId: thread.id,
        },
      }))
    )

    await thread.send({
      content: `Lagt till: ${list.length} jobb i kön.`,
    })
    thread.sendTyping()
  },
}
