import { SlashCommandBuilder, TextChannel } from 'discord.js'
import { pdf2Markdown } from '../../queues'

export default {
  data: new SlashCommandBuilder()
    .setName('parse')
    .addStringOption((option) =>
      option
        .setName('urls')
        .setDescription('URL(s) to PDF file(s)')
        .setRequired(true)
    )
    .setDescription(
      'Skicka in en årsredovisning och få tillbaka utsläppsdata.'
    ),

  async execute(interaction) {
    console.log('parse')
    await interaction.deferReply({ ephemeral: true })

    const urls = interaction.options
      .getString('urls')
      ?.split(/\s*,\s*|\s+/)
      .map((url) => url.trim()) // Remove whitespace
      .filter(Boolean) // Remove empty strings
      .filter((url) => url.startsWith('http')) // Only allow URLs
    if (!urls || !urls.length) {
      await interaction.followUp({
        content:
          'No urls provided. Try again with /parse <urls> (separate with comma or new lines)',
        ephemeral: true,
      })

      return
    } else {
      await interaction.followUp({
        content: `Your PDF is being processed`,
      })
    }

    urls.forEach(async (url) => {
      const thread = await (interaction.channel as TextChannel).threads.create({
        name: url.slice(-20),
        autoArchiveDuration: 1440,
        //startMessage: message.id,
      })
      const threadId = thread.id

      thread.send({
        content: `Tack! Nu är din årsredovisning placerad i kö för hantering av LLama
${url}`,
      })
      pdf2Markdown.add('parse pdf ' + url.slice(-20), {
        url,
        threadId,
      })
    })
  },
}
