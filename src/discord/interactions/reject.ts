import { saveToDb } from '../../queues'

export default {
  async execute(interaction, job) {
    const { documentId, threadId } = job.data

    await saveToDb.add('saveToDb', {
      documentId,
      threadId,
      state: 'rejected',
    })

    interaction.update({
      content: 'Rejected!',
      embeds: [],
      components: [],
    })
  },
}
