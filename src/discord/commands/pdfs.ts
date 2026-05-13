import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js'
import { queues } from '../../queues'

export default {
  data: new SlashCommandBuilder()
    .setName('pdfs')
    .setDescription(
      'Skicka in en eller flera årsredovisningar och få tillbaka utsläppsdata.'
    )
    .addStringOption((option) =>
      option
        .setName('urls')
        .setDescription('URLs to PDF files. Separate with comma or new lines.')
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName('auto-approve')
        .setDescription('Automatically approve the extracted data.')
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName('force-reindex')
        .setDescription('Re-index markdown even if already indexed')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('tags')
        .setDescription(
          'Comma-separated tag slugs to apply when the company is created/updated (e.g. public,large-cap)'
        )
        .setRequired(false)
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

      const autoApprove =
        interaction.options.getBoolean('auto-approve') || false
      const forceReindex =
        interaction.options.getBoolean('force-reindex') || false
      const tagsOption = interaction.options.getString('tags')
      const tags = tagsOption
        ? tagsOption
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined

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

      urls.forEach(async (url) => {
        const thread = await (
          interaction.channel as TextChannel
        ).threads.create({
          name: url.slice(-20),
          autoArchiveDuration: 1440,
        })

        thread.send(`PDF i kö: ${url}`)
        thread.send(
          `Be användaren att verifiera data: ${autoApprove ? 'Nej' : 'Ja'}`
        )
        if (forceReindex) {
          thread.send(`🔁 Force re-index enabled`)
        }
        queues.parsePdf.add(
          'download ' + url.slice(-20),
          {
            url: url.trim(),
            discordThreadId: thread.id,
            autoApprove,
            forceReindex,
            ...(tags?.length && { tags }),
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
