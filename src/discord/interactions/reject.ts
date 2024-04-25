import { saveToDb } from '../../queues'

export default {
  async execute(interaction, job) {
    const { documentId } = job.data

    await saveToDb.add('saveToDb', {
      documentId,
      state: 'rejected',
    })

    interaction.update({
      content: 'Rejected!',
      embeds: [],
      components: [],
    })
  },
}
