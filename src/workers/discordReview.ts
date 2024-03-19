import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import elastic from '../elastic'
import discord from '../discord'
import {
  ModalBuilder,
  ButtonBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ModalActionRowComponentBuilder,
  TextInputStyle,
} from 'discord.js'
import { scope2Image } from '../lib/imageCreator'

class JobData extends Job {
  data: {
    url: string
    json: string
    channelId: string
    messageId: string
    pdfHash: string
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
    let documentId = ''
    try {
      //documentId = await elastic.indexReport(job.data.pdfHash, parsedJson, job.data.url)
    } catch (error) {
      job.log(`Error indexing report: ${error.message}`)
    }

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

    const image = await scope2Image(parsedJson)

    discord.sendMessageToChannel(discord.channelId, {
      content: `Ny företagsdata behöver manuell hantering: 
        ${parsedJson.reviewComment}
        ${job.data.url}`,
      embeds: [
        {
          title: 'Här är data som behöver granskas',
          image: {
            url: image,
          },
        },
      ],
      components: [row],
    })

    job.updateProgress(40)

    discord.client.on('interactionCreate', async (interaction) => {
      let reportState = ''
      if (interaction.isButton() && interaction.customId === 'approve') {
        reportState = 'approved'
        interaction.update({
          content: 'Approved!',
          embeds: [],
          components: [],
        })
      } else if (interaction.isButton() && interaction.customId === 'edit') {
        reportState = 'edited'
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
          .setTitle(`Granska data för ${parsedJson.companyName}`)
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
        reportState = 'rejected'
        interaction.update({
          content: 'Rejected!',
          embeds: [],
          components: [],
        })
      }

      if (reportState !== '') {
        try {
          await elastic.updateDocumentState(documentId, reportState)
        } catch (error) {
          job.log(`Error updating document state: ${error.message}`)
        }
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
