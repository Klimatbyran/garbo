import { EmbedBuilder } from 'discord.js'

export default {
  async execute(interaction, job) {
    const { documentId } = job.data
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
