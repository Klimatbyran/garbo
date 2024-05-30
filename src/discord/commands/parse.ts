import { SlashCommandBuilder, TextChannel } from 'discord.js'
import { pdf2Markdown, searchVectors } from '../../queues'
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';
import chromadb from '../../config/chromadb';
import openai from '../../config/openai'

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
    const client = new ChromaClient(chromadb);
    const embedder = new OpenAIEmbeddingFunction(openai);

    for (const url of urls) {
      const thread = await (interaction.channel as TextChannel).threads.create({
        name: url.slice(-20),
        autoArchiveDuration: 1440,
      });
      const threadId = thread.id;

      thread.send({
        content: `Tack! Nu är din årsredovisning placerad i kö för hantering av LLama
${url}`,
      });

      try {
        const collection = await client.getOrCreateCollection({
          name: 'emission_reports',
          embeddingFunction: embedder,
        });
        const exists = await collection
          .get({
            where: { source: url },
          })
          .then((r) => r?.documents?.length > 0);

        if (exists) {
          console.log(`URL ${url} already exists in the database. Jumping to search vectors.`);
          thread.send(`✅ Detta dokument fanns redan i vektordatabasen. Jumping to search vectors.`);
          // Jump to the search vectors job
          searchVectors.add('search ' + url.slice(-20), {
            url,
            threadId,
          });
        } else {
          console.log(`URL ${url} does not exist. Proceeding with download.`);
          pdf2Markdown.add('parse pdf ' + url.slice(-20), {
            url,
            threadId,
          });
        }
      } catch (error) {
        console.error(`Error checking URL ${url}: ${error}`);
        thread.send(`❌ Ett fel uppstod när vektordatabasen skulle nås: ${error}`);
      }
    }
  },
};
