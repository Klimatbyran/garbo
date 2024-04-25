export default {
  async execute(interaction, job) {
    const { url, channelId, messageId, existingId, existingPdfHash } = job.data
    interaction.update({
      content: 'Rejected!',
      embeds: [],
      components: [],
    })
  },
}
