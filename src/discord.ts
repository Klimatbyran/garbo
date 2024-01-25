import { Client, GatewayIntentBits, REST, Routes } from 'discord.js'
import commands from './commands'

export default class Discord {
  client: Client<boolean>
  rest: REST
  commands: Array<any>
  token: string

  constructor({ token, guildId, clientId }) {
    this.token = token
    this.client = new Client({ intents: [GatewayIntentBits.Guilds] })
    this.rest = new REST().setToken(token)
    this.commands = commands.map((command) => command.data.toJSON())
    this.client.on('ready', () => {
      console.log('discord connected')
      const url = Routes.applicationGuildCommands(clientId, guildId)
      this.rest.put(url, { body: this.commands })
    })
    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isCommand()) return
      const command = commands.find(
        (command) => command.data.name === interaction.commandName
      )
      try {
        await command.execute(interaction)
      } catch (error) {
        console.error('Discord error:', error)
        await interaction.reply({
          content: 'There was an error while executing this command!',
          ephemeral: true,
        })
      }
    })
  }
  login(token) {
    return this.client.login(token)
  }
}
