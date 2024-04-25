import { EmbedBuilder } from 'discord.js'
import { userFeedback } from '../queues'

export default {
  async execute(interaction, job) {
    const { documentId, channelId } = job.data

    const submitted = await interaction
      .awaitModalSubmit({
        time: 60000 * 20, // user has to submit the modal within 20 minutes
        filter: (i) => i.user.id === interaction.user.id, // only user who clicked button can interact with modal
      })
      .catch((error) => {
        console.error(error)
        return null
      })

    if (submitted) {
      const userInput = submitted.fields.getTextInputValue('editInput')
      //this.emit('edit', documentId, userInput)

      await submitted.reply({
        content: `Tack för din feedback: \n ${userInput}`,
      })
      await userFeedback.add('userFeedback', {
        documentId,
        messageId: interaction.message.id,
        channelId,
        feedback: userInput,
      })
    }
  },
}
