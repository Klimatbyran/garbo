import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js'
import { queues } from '../../queues'
import { DiscordJob } from '../../lib/DiscordWorker'

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

      const processUrl = async (url: string): Promise<void> => {
        try {
          const thread = await (
            interaction.channel as TextChannel
          ).threads.create({
            name: url.slice(-20),
            autoArchiveDuration: 1440,
          })

          await thread.send(`PDF i kö: ${url}`)
          await thread.send(
            `Be användaren att verifiera data: ${autoApprove ? 'Nej' : 'Ja'}`
          )
          await queues.nlmParsePDF.queue.add(
            'download ' + url.slice(-20),
            {
              url: url.trim(),
              threadId: thread.id,
              autoApprove,
            } as DiscordJob['data'],
            {
              backoff: {
                type: 'fixed',
                delay: 60_000,
              },
              attempts: 10,
            }
          )
        } catch (error) {
          console.error(`Error processing URL ${url}:`, error)
          // Retry after a delay
          await new Promise((resolve) => setTimeout(resolve, 5000))
          return processUrl(url)
        }
      }

      const processAllUrls = async (): Promise<void> => {
        for (const url of urls) {
          await processUrl(url)
        }
      }

      await processAllUrls()
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
