import { ButtonInteraction } from 'discord.js'
import { DiscordJob } from '../../lib/DiscordWorker'

export default {
  async execute(interaction: ButtonInteraction, job: DiscordJob) {
    job.updateData({ ...job.data, approved: true })
    job.retry()
    job.log(`Approving company edit: ${job.data.wikidataId}`)
    interaction.reply({
      content: `Tack för din granskning, ${interaction?.user?.username}!`,
    })
    //discord.lockThread(threadId)
  },
}
