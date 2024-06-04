import { saveToDb } from '../../queues'
import discord from '../../discord'

export default {
  async execute(interaction, job) {
    const { documentId, threadId } = job.data

    await saveToDb.add(
      'saveToDb',
      {
        documentId,
        threadId,
        state: 'rejected',
      },
      { attempts: 10 }
    )

    interaction.update({
      content: 'Rejected!',
      embeds: [],
      components: [],
    })
    discord.lockThread(threadId)
  },
}
