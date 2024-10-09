import discord from '../../discord'

export default {
  async execute(interaction, job) {
    const { documentId, threadId } = job.data

    throw new Error('Not implemented yet: API: reject')

    interaction.update({
      content: 'Rejected!',
      embeds: [],
      components: [],
    })
    discord.lockThread(threadId)
  },
}
