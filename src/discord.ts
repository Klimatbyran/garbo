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
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  BaseMessageOptions,
  MessagePayload,
  MessageCreateOptions,
} from 'discord.js'
import commands from './discord/commands'
import config from './config/discord'
import approve, { ApproveJob } from './discord/interactions/approve'
import edit, { EditWikidataJob } from './discord/interactions/editWikidata'
import saveToAPI from './workers/saveToAPI'
import guessWikidata from './workers/guessWikidata'
import { DiscordJob } from './lib/DiscordWorker'

const queuesWithInteractions = {
  saveToAPI: saveToAPI.queue,
  guessWikidata: guessWikidata.queue,
} as const

// NOTE: Maybe find a way to define the valid keys in one place - ideally the lookup keys
const queueNameSchema = z.enum(['saveToAPI', 'guessWikidata'])

const getJob = (
  queueName: keyof typeof queuesWithInteractions,
  jobId: string
) => queuesWithInteractions[queueName].getJob(jobId)

export class Discord {
  client: Client<boolean>
  rest: REST
  commands: Array<RESTPostAPIChatInputApplicationCommandsJSONBody>
  token: string
  channelId: string

  constructor({ worker, token, guildId, clientId, channelId }) {
    this.token = token
    this.channelId = channelId
    this.client = new Client({ intents: [GatewayIntentBits.Guilds] })
    this.rest = new REST().setToken(token)
    if (!worker) {
      this.commands = commands.map((command) => command.data.toJSON())
      this.client.on('ready', () => {
        console.log('discord switch connected')
        const url = Routes.applicationGuildCommands(clientId, guildId)
        this.rest.put(url, { body: this.commands })
      })

      // mentioned user
      // this.client.on('messageCreate', async (message) => {
      //   if (message.author.bot) return
      //   const mentioned = message.mentions.users.filter((user) => user.id !== this.client.user.id).first()
      //   if (mentioned) {
      //     console.log('mentioned user:', mentioned.username)
      //     // TODO: add message to feedback queue
      // })

      this.client.on('interactionCreate', async (interaction) => {
        if (interaction.isCommand()) {
          const command = commands.find(
            (command) => command.data.name === interaction.commandName
          )
          if (!command) {
            console.error(
              `Discord error: Command "${interaction.commandName}" not found`
            )
            return
          }

          try {
            await command.execute(interaction as ChatInputCommandInteraction)
          } catch (error) {
            console.error('Discord error:', error)
            // await interaction.reply({
            //   content: 'There was an error while executing this command!',
            //   ephemeral: true,
            // })
            return
          }
        } else if (interaction.isButton()) {
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

  async sendMessage(
    { threadId }: { threadId: string },
    msg: string | BaseMessageOptions
  ) {
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

  async sendTyping({ threadId }: { threadId: string }) {
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
