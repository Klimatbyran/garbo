import { ButtonInteraction } from 'discord.js'
import { DiscordJob } from '../../lib/DiscordWorker'

class ApproveJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    wikidata: { node: string }
  }
}

export default {
  async execute(interaction: ButtonInteraction, job: ApproveJob) {
    await job.updateData({ ...job.data, approved: true })

    job.log(`Approving company edit: ${job.data.wikidata.node}`)
    await interaction.reply({
      content: `Tack för din granskning, ${interaction?.user?.username}!`,
    })

    await job.promote()
  },
}
