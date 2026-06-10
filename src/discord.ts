import { z } from 'zod'
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  TextChannel,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  Message,
  ThreadChannel,
  BaseMessageOptions,
  MessagePayload,
  MessageCreateOptions,
} from 'discord.js'
import config from './config/discord'
import approve, { ApproveJob } from './discord/interactions/approve'
import edit, { EditWikidataJob } from './discord/interactions/editWikidata'
import editCompanyName, {
  EditCompanyNameJob,
} from './discord/interactions/inputCompanyName'
import { queues } from './queues'
import { DiscordJob } from './lib/DiscordWorker'
import diffBaseYear from './workers/diffBaseYear'

const queuesWithInteractions = {
  saveToAPI: queues.saveToAPI,
  guessWikidata: queues.guessWikidata,
  precheck: queues.precheck,
  diffReportingPeriods: queues.diffReportingPeriods,
  diffGoals: queues.diffGoals,
  diffLEI: queues.diffLEI,
  diffTags: queues.diffTags,
  diffInitiatives: queues.diffInitiatives,
  diffIndustry: queues.diffIndustry,
  diffDescriptions: queues.diffDescriptions,
  diffBaseYear: queues.diffBaseYear,
} as const

// NOTE: Maybe find a way to define the valid keys in one place - ideally the lookup keys
const queueNameSchema = z.enum([
  'saveToAPI',
  'guessWikidata',
  'precheck',
  'diffReportingPeriods',
  'diffGoals',
  'diffLEI',
  'diffTags',
  'diffInitiatives',
  'diffIndustry',
  'diffDescriptions',
  'diffBaseYear',
])

const getJob = (
  queueName: keyof typeof queuesWithInteractions,
  jobId: string
) => queuesWithInteractions[queueName].queue.getJob(jobId)

export class Discord {
  client: Client<boolean>
  token: string
  channelId: string

  constructor({ worker, token, guildId, clientId, channelId }) {
    this.token = token
    this.channelId = channelId
    this.client = new Client({ intents: [GatewayIntentBits.Guilds] })
    if (!worker) {
      this.client.on('ready', () => {
        console.log('discord switch connected')
        const rest = new REST().setToken(token)
        const url = Routes.applicationGuildCommands(clientId, guildId)
        rest.put(url, { body: [] })
      })

      this.client.on('interactionCreate', async (interaction) => {
        if (interaction.isButton()) {
          const [action, rawQueueName, jobId] = interaction.customId.split('~')
          const queueName = queueNameSchema.parse(rawQueueName)

          try {
            switch (action) {
              case 'approve': {
                const job = (await getJob(queueName, jobId)) as ApproveJob
                if (!job) await interaction.reply('Job not found')
                else await approve.execute(interaction, job)

                break
              }
              case 'editWikidata': {
                const job = (await getJob(queueName, jobId)) as EditWikidataJob
                if (!job) await interaction.reply('Job not found')
                else await edit.execute(interaction, job)
                break
              }
              case 'editCompanyName': {
                const job = (await getJob(
                  queueName,
                  jobId
                )) as EditCompanyNameJob
                if (!job) await interaction.reply('Job not found')
                else await editCompanyName.execute(interaction, job)
                break
              }
            }
          } catch (error) {
            console.error('Discord error:', error)
          }
        } //else if (interaction.isModalSubmit()) {}
      })
    } else {
      this.client.on('ready', () => {
        console.log('discord worker connected')
      })
    }
  }

  async login(token = this.token) {
    await this.client.login(token)
    return this
  }

  public createApproveButtonRow = (job: DiscordJob) => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`approve~${job.queueName}~${job.id}`)
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success)
    )
  }

  public createEditWikidataButtonRow = (job: DiscordJob) => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`approve~${job.queueName}~${job.id}`)
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`editWikidata~${job.queueName}~${job.id}`)
        .setLabel('Edit')
        .setStyle(ButtonStyle.Secondary)
    )
  }

  public createEditCompanyNameButtonRow = (job: DiscordJob) => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`editCompanyName~${job.queueName}~${job.id}`)
        .setLabel('Enter Company Name')
        .setStyle(ButtonStyle.Primary)
    )
  }

  async sendMessage(threadId: string, msg: string | BaseMessageOptions) {
    try {
      if (!threadId) throw new Error('Thread ID is required')

      const thread = (await this.client.channels.fetch(
        threadId
      )) as ThreadChannel
      await thread?.sendTyping()
      return thread?.send(msg)
    } catch (e) {
      console.error('Error sending message to thread', e)
      return null
    }
  }

  async sendTyping(threadId: string) {
    const thread = (await this.client.channels.fetch(threadId)) as ThreadChannel
    return thread.sendTyping()
  }

  async createThread(
    { channelId, messageId }: { channelId: string; messageId: string },
    name: string
  ) {
    const channel = (await this.client.channels.fetch(channelId)) as TextChannel
    const message = await channel.messages.fetch(messageId)
    return message.startThread({
      name: name,
      autoArchiveDuration: 60,
    })
  }

  async editMessage(
    data: { channelId: string; threadId: string; messageId: string },
    editedMessage: string
  ) {
    const message = await this.findMessage(data)
    return message?.edit(editedMessage)
  }

  async findMessage({
    channelId,
    threadId,
    messageId,
  }: {
    channelId?: string
    threadId?: string
    messageId: string
  }) {
    const id = threadId || channelId
    if (!id) {
      console.error(`Discord error: Unable to find message - no id provided:`, {
        channelId,
        threadId,
      })
      return null
    }
    const channel = (await this.client.channels.fetch(id)) as TextChannel
    const message = await channel.messages.fetch(messageId)
    return message
  }

  async sendMessageToChannel(
    channelId: string,
    message: string | MessagePayload | MessageCreateOptions
  ): Promise<Message> {
    const channel = (await this.client.channels.fetch(channelId)) as TextChannel
    return await channel?.send(message)
  }

  async lockThread(channelId: string) {
    const channel = await this.client.channels.fetch(channelId)
    if (channel?.isThread()) {
      await channel.setLocked(true)
      //await channel.setArchived(true);
    } else {
      console.error('The specified channel is not a thread.')
    }
  }
}

export default new Discord(config)
