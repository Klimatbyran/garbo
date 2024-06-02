import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import opensearch from '../../opensearch'

export default {
  data: new SlashCommandBuilder()
    .setName('approve')
    .addStringOption((option) =>
      option
        .setName('documentid')
        .setDescription('The documentId to approve')
        .setRequired(true)
    )
    .setDescription('Godkänn en årsredovisning.'),

  async execute(interaction: ChatInputCommandInteraction) {
    const documentId = interaction.options.getString('documentid')
    console.log('approve: <' + documentId + '>')
    try {
      await interaction.deferReply({ ephemeral: true })
      if (!documentId || !documentId.length) {
        await interaction.followUp({
          content:
            'No documentid provided. Try again with /approve <documentid>',
          ephemeral: true,
        })
        return
      } else {
        await opensearch.updateDocumentState(documentId, 'approved')
        await interaction.followUp({
          content: `Rapport godkänd: ${documentId}`,
        })
      }
    } catch (error) {
      console.error('Error trying to approve: ', error)
      try {
        await interaction.followUp({
          content: 'Error trying to approve. Please try again later',
          ephemeral: true,
        })
      } catch (error) {
        console.error('Approve: Error in error handling:', error)
      }
    }
  },
}
