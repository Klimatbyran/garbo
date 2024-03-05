import { SlashCommandBuilder } from 'discord.js'
import { checkURL } from '../queues'

export default {
  data: new SlashCommandBuilder()
    .setName('analyze')
    .addStringOption((option) =>
      option.setName('url').setDescription('URL to report file').setRequired(true)
    )
    .setDescription(
      'Skicka in en årsredovisning och få tillbaka utsläppsdata.'
    ),

  async execute(interaction) {
    console.log('analyze')
    const url = interaction.options.getString('url')
    if (!url) {
      await interaction.followUp({
        content: 'No url provided. Try again with /analyze <url>',
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

    checkURL.add('download report ' + url.slice(-20), {
      url,
      channelId,
      messageId,
    })

  },
}
