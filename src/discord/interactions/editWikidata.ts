import {
  ActionRowBuilder,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js'
import { DiscordJob } from '../../lib/DiscordWorker'
import { Wikidata } from '../../prompts/wikidata'
import config from '../../config/discord'

export class EditWikidataJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    wikidata?: Wikidata
    overrideWikidataId?: string
  }
}

export default {
  async execute(interaction: ButtonInteraction, job: EditWikidataJob) {
    const modalId = `edit_wikidata_modal_${job.id}`
    const modal = new ModalBuilder()
      .setCustomId(modalId)
      .setTitle('Override Wikidata ID')

    const textInput = new TextInputBuilder()
      .setCustomId('overrideWikidataId')
      .setLabel('Enter the new Wikidata ID')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('E.g., Q123456')
      .setRequired(true)

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      textInput,
    )
    modal.addComponents(actionRow)
    await interaction.showModal(modal)

    const submittedInteraction = await interaction.awaitModalSubmit({
      filter: (i) => i.customId === `edit_wikidata_modal_${job.id}`,
      time: config.modalInteractionTimeout,
    })

    if (!submittedInteraction) {
      await interaction.reply({
        content: 'You did not respond in time!',
        ephemeral: true,
      })
      return
    }

    const overrideWikidataId =
      submittedInteraction.fields.getTextInputValue('overrideWikidataId')

    await job.updateData({ ...job.data, overrideWikidataId })
    job.log(`Edited wikidataId: ${overrideWikidataId}`)

    await submittedInteraction.reply({
      content: `Thank you for the update, ${interaction?.user?.username}! The new Wikidata ID is: ${overrideWikidataId}`,
      ephemeral: true,
    })

    if (await job.isDelayed()) {
      await job.promote()
    } else if ((await job.isCompleted()) || (await job.isFailed())) {
      await job.retry()
    }
  },
}
