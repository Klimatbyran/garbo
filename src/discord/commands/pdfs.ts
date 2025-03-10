import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js'
import nlmParsePDF from '../../workers/nlmParsePDF'

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
      'Skicka in en eller flera årsredovisningar och få tillbaka utsläppsdata.'
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
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
            'No urls provided. Try again with /pdfs <urls> (separate with comma or new lines)',
          ephemeral: true,
        })

        return
      } else {
        await interaction.followUp({
          content: `Your PDFs are being processed`,
        })
      }
      // const message = await interaction.reply(
      //   `Processing ${urls.length} PDFs...`
      // )

      urls.forEach(async (url) => {
        const thread = await (
          interaction.channel as TextChannel
        ).threads.create({
          name: url.slice(-20),
          autoArchiveDuration: 1440,
          //startMessage: message.id,
        })

        thread.send(`PDF i kö: ${url}`)
        nlmParsePDF.queue.add(
          'download ' + url.slice(-20),
          {
            url: url.trim(),
            threadId: thread.id,
          },
          {
            backoff: {
              type: 'fixed',
              delay: 60_000,
            },
            attempts: 10,
          }
        )
      })
    } catch (error) {
      console.error('Pdfs: error', error)
      try {
        await interaction.followUp({
          content: 'An error occurred while processing the PDFs.',
          ephemeral: true,
        })
      } catch (error) {
        console.error('Pdfs: Error in error handling:', error)
      }
    }
  },
}
