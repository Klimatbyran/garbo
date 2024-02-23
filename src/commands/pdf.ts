import { SlashCommandBuilder } from 'discord.js'
import { downloadPDF } from '../queues'

export default {
  data: new SlashCommandBuilder()
    .setName('pdf')
    .addStringOption((option) =>
      option.setName('url').setDescription('URL to PDF file').setRequired(true)
    )
    .setDescription(
      'Skicka in en årsredovisning och få tillbaka utsläppsdata.'
    ),

  async execute(interaction) {
    console.log('pdf')
    const url = interaction.options.getString('url')
    if (!url) {
      await interaction.followUp({
        content: 'No url provided. Try again with /pdf <url>',
        ephemeral: true,
      })

      return
    }

    const reply = await interaction.reply({
      content: 'Tack! Nu är din årsredovisning placerad i kö.',
      fetchReply: true
    })
    const channelId = interaction.channelId;
    const messageId = reply.id;

    downloadPDF.add('download pdf ' + url.slice(-20), {
      url,
      channelId,
      messageId,
    })

  },
}
