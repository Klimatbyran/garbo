import { ButtonInteraction } from 'discord.js'
import { PipelineJob } from '../../lib/PipelineWorker'
import { Wikidata } from '../../prompts/wikidata'

export class ApproveJob extends PipelineJob {
  declare data: PipelineJob['data'] & {
    wikidata?: Wikidata
  }
}

export default {
  async execute(interaction: ButtonInteraction, job: ApproveJob) {
    let { approval, ...data } = job.data
    if (approval) {
      approval.approved = true
      await job.updateData({ ...data, approval })
      job.log(`Approving company edit: ${job.data.wikidata?.node ?? 'unknown'}`)

      await interaction.reply({
        content: `Tack för din granskning, ${interaction?.user?.username}!`,
      })
    }

    await job.promote()
  },
}
