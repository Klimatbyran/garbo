import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js'
import { downloadPDF } from '../../queues'
import discord from '../../discord'

export default {
  data: new SlashCommandBuilder()
    .setName('pdf')
    .addStringOption((option) =>
      option.setName('url').setDescription('URL to PDF file').setRequired(true)
    )
    .setDescription(
      'Skicka in en årsredovisning och få tillbaka utsläppsdata.'
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    console.log('pdf')
    const url = interaction.options.getString('url')
    if (!url) {
      await interaction.followUp({
        content: 'No url provided. Try again with /pdf <url>',
        ephemeral: true,
      })

      return
    }
    const message = await interaction.reply({
      content: `Tack! Nu är din årsredovisning placerad i kö:
${url}`,
    })

    const thread = await discord.createThread(
      {
        channelId: interaction.channel.id,
        messageId: message.id,
      },
      'pdf'
    )
    /*thread.send({
      content: `Tack! Nu är din årsredovisning placerad i kö: 
      ${url}`,
    })*/

    const threadId = thread.id

    downloadPDF.add('download pdf ' + url.slice(-20), {
      url,
      threadId,
    })
  },
}
