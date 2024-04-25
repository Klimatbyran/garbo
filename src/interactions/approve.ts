import { EmbedBuilder } from 'discord.js'
import { saveToDb } from '../queues'

export default {
  async execute(interaction, job) {
    const { documentId } = job.data
    saveToDb.add('saveToDb', {
      documentId,
      state: 'approved',
    })
    interaction.update({
      embeds: [
        new EmbedBuilder()
          .setTitle(`Godkänd (reportId: ${documentId})`)
          .setDescription(
            `Tack för din granskning, ${interaction?.user?.username}!`
          ),
      ],
      components: [],
    })
  },
}
