import { SlashCommandBuilder, TextChannel } from 'discord.js'
import { downloadPDF } from '../../queues'

export default {
  data: new SlashCommandBuilder()
    .setName('pdfs')
    .addStringOption((option) =>
      option
        .setName('urls')
        .setDescription('URLs to PDF files. Separate with comma or new lines.')
        .setRequired(true)
    )
    .setDescription(
      'Skicka in en årsredovisning och få tillbaka utsläppsdata.'
    ),

  async execute(interaction) {
    console.log('pdfs')
    const urls = interaction.options
      .getString('urls')
      ?.split(/\s*,\s*|\s+/)
      .map((url) => url.trim()) // Remove whitespace
      .filter(Boolean) // Remove empty strings
      .filter((url) => url.startsWith('http')) // Only allow URLs
    if (!urls || !urls.length) {
      await interaction.followUp({
        content:
          'No urls provided. Try again with /pdfs <urls> (separate with comma or new lines)',
        ephemeral: true,
      })

      return
    }
    await interaction.deferReply() // Acknowledge the command to prevent 'interaction failed'

    urls.forEach(async (url) => {
      const thread = await (interaction.channel as TextChannel).threads.create({
        name: url.slice(-20),
        autoArchiveDuration: 1440,
      })

      thread.send({
        content: `Tack! Nu är din årsredovisning placerad i kö: 
${url}`,
      })
      const threadId = thread.id
      downloadPDF.add('download pdf ' + url.slice(-20), {
        url,
        threadId,
      })
    })
  },
}
