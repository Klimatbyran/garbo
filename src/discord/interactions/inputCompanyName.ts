import {
  ActionRowBuilder,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js'
import { DiscordJob } from '../../lib/DiscordWorker'
import config from '../../config/discord'

export class EditCompanyNameJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName?: string
    manualCompanyName?: string
  }
}

export default {
  async execute(interaction: ButtonInteraction, job: EditCompanyNameJob) {
    const modalId = `edit_company_name_modal_${job.id}`
    const modal = new ModalBuilder()
      .setCustomId(modalId)
      .setTitle('Enter Company Name')

    const textInput = new TextInputBuilder()
      .setCustomId('manualCompanyName')
      .setLabel('Enter the company name')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('E.g., Stora Enso')
      .setRequired(true)

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      textInput
    )
    modal.addComponents(actionRow)
    await interaction.showModal(modal)

    const submittedInteraction = await interaction.awaitModalSubmit({
      filter: (i) => i.customId === modalId,
      time: config.modalInteractionTimeout,
    })

    if (!submittedInteraction) {
      await interaction.reply({
        content: 'You did not respond in time!',
        ephemeral: true,
      })
      return
    }

    const manualCompanyName =
      submittedInteraction.fields.getTextInputValue('manualCompanyName')

    await job.updateData({ ...job.data, companyName: manualCompanyName })
    job.log(`Manually provided company name: ${manualCompanyName}`)

    await submittedInteraction.reply({
      content: `Thank you for providing the company name, ${interaction?.user?.username}! Using: ${manualCompanyName}`,
      ephemeral: false,
    })

    if (await job.isDelayed()) {
      await job.promote()
    } else if ((await job.isCompleted()) || (await job.isFailed())) {
      await job.retry()
    }
  },
}
