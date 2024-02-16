import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import discord from '../discord'
import { Client } from '@elastic/elasticsearch'
import {
  ModalBuilder,
  ButtonBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ModalActionRowComponentBuilder,
  TextInputStyle,
} from 'discord.js'
import elasticsearch from '../config/elasticsearch'

class JobData extends Job {
  data: {
    url: string
    json: string
  }
}

const worker = new Worker(
  'discordReview',
  async (job: JobData) => {
    // Is this a problem to do every time?
    job.updateProgress(5)

    job.log(`Sending for review in Discord: ${job.data.json}`)

    job.updateProgress(10)
    const parsedJson = JSON.parse(job.data.json)

    // Skapa en knapp
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('approve')
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('edit')
        .setLabel('Edit')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('reject')
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger)
    )

    discord.sendMessageToChannel(discord.channelId, {
      content: `Ny företagsdata behöver manuell hantering: 
        ${parsedJson.ReviewComment}
        ${job.data.url}`,
      embeds: [
        {
          title: 'Review this JSON:',
          description:
            '```json\n' + JSON.stringify(parsedJson, null, 2) + '\n```',
        },
      ],
      components: [row],
    })

    job.updateProgress(40)

    discord.client.on('interactionCreate', async (interaction) => {
      if (interaction.isButton() && interaction.customId === 'approve') {
        interaction.update({
          content: 'Approved!',
          embeds: [],
          components: [],
        })

        const client = new Client(elasticsearch)

        await client.index({
          index: 'companies_emissions',
          body: {
            ...parsedJson,
            reviewed: true,
            reviewStatus: 'approved',
            reviewedBy: interaction.user.id,
            reviewedAt: new Date(),
          },
        })
      } else if (interaction.isButton() && interaction.customId === 'edit') {
        const input = new TextInputBuilder()
          .setCustomId('editInput')
          .setLabel(`Granska utsläppsdata`)
          .setStyle(TextInputStyle.Paragraph)

        const actionRow =
          new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            input
          )

        const modal = new ModalBuilder()
          .setCustomId('editModal')
          .setTitle(`Granska data för ${parsedJson.CompanyName}`)
          .addComponents(actionRow)
        // todo diskutera hur detta görs på bästa sätt för mänskliga granskaren. vad är alex input?

        await interaction.showModal(modal)

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
          await submitted.reply({
            content: `Tack för din granskning: \n ${userInput}`,
          })
        }
      } else if (interaction.isButton() && interaction.customId === 'reject') {
        // todo diskutera vad vill vill händer. ska man ens få rejecta?
        interaction.update({
          content: 'Rejected!',
          embeds: [],
          components: [],
        })
      }
    })

    job.updateProgress(100)
  },
  {
    connection: redis,
    autorun: false,
  }
)

export default worker
