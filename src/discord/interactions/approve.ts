import { ButtonInteraction, EmbedBuilder, Interaction } from 'discord.js'
import { saveToDb } from '../../queues'
import discord from '../../discord'

export default {
  async execute(interaction: ButtonInteraction, job) {
    const { documentId, threadId } = job.data
    job.log(`Approving documentId: ${documentId}`)
    saveToDb.add(
      'saveToDb',
      {
        threadId,
        documentId,
        state: 'approved',
      },
      { attempts: 10 }
    )
    interaction.reply({
      content: `Tack för din granskning, ${interaction?.user?.username}!`,
    })
    /*interaction.update({
      embeds: interaction.[
        new EmbedBuilder()
          .setTitle(`Godkänd (reportId: ${documentId})`)
          .setDescription(
            `Tack för din granskning, ${interaction?.user?.username}!`
          ),
      ],
      components: [],
    })*/
    //discord.lockThread(threadId)
  },
}
