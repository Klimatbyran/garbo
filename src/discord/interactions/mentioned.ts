import { userFeedback } from '../../queues'

export default {
  async execute(interaction, job) {
    if (job) {
      await userFeedback.add('userFeedback', {
        ...job.data,
        feedback: interaction.message.content,
      })
    } else {
      interaction.message.reply('Hittade inget jobb att ge feedback på.')
    }
  },
}
