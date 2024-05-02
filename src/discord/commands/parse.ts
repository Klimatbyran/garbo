import { SlashCommandBuilder, TextChannel } from 'discord.js'
import { pdf2Markdown } from '../../queues'

export default {
  data: new SlashCommandBuilder()
    .setName('parse')
    .addStringOption((option) =>
      option.setName('url').setDescription('URL to PDF file').setRequired(true)
    )
    .setDescription(
      'Skicka in en årsredovisning och få tillbaka utsläppsdata.'
    ),

  async execute(interaction) {
    console.log('parse')
    await interaction.deferReply({ ephemeral: true })

    const url = interaction.options.getString('url')
    if (!url) {
      await interaction.followUp({
        content: 'No url provided. Try again with /parse <url>',
        ephemeral: true,
      })

      return
    } else {
      await interaction.followUp({
        content: `Your PDF is being processed`,
      })
    }

    const thread = await (interaction.channel as TextChannel).threads.create({
      name: 'pdf',
      autoArchiveDuration: 1440,
    })

    thread.send({
      content: `Tack! Nu är din årsredovisning placerad i kö för hantering av LLama
${url}`,
    })

    const threadId = thread.id

    pdf2Markdown.add('parse pdf ' + url.slice(-20), {
      url,
      threadId,
    })
  },
}
