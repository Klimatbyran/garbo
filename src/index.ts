import dotenv from 'dotenv'
dotenv.config() // keep this line first in file

import express from 'express'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import Discord, {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} from 'discord.js'
import discord from './config/discord'

// keep this line, otherwise the workers won't be started
import * as workers from './workers'
import {
  discordReview,
  downloadPDF,
  indexParagraphs,
  parseText,
  reflectOnAnswer,
  searchVectors,
  splitText,
} from './queues'

import commands from './commands'

// add dummy job
// downloadPDF.add('dummy', {
//   url: 'https://mb.cision.com/Main/17348/3740648/1941181.pdf',
// })
/*
downloadPDF.add('volvo', {
  url: 'https://www.volvogroup.com/content/dam/volvo-group/markets/master/investors/reports-and-presentations/annual-reports/AB-Volvo-Annual-Report-2022.pdf',
})*/

// start workers
Object.values(workers).forEach((worker) => worker.run())

// start ui
const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
  queues: [
    new BullMQAdapter(downloadPDF),
    new BullMQAdapter(splitText),
    new BullMQAdapter(indexParagraphs),
    new BullMQAdapter(searchVectors),
    new BullMQAdapter(parseText),
    new BullMQAdapter(reflectOnAnswer),
    new BullMQAdapter(discordReview),
  ],
  serverAdapter: serverAdapter,
  options: {
    uiConfig: {
      boardTitle: 'Klimatkollen',
    },
  },
})

// register discord bot commands
const client = new Client({ intents: [GatewayIntentBits.Guilds] })
const rest = new REST().setToken(discord.token)
const json = commands.map((command) => command.data.toJSON())
client.on('ready', () => {
  console.log('discord connected')
  const url = Routes.applicationGuildCommands(discord.clientId, discord.guildId)
  rest.put(url, { body: json })
})
client.on('interactionCreate', async (interaction) => {
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
client.login(discord.token)

const app = express()

app.use('/admin/queues', serverAdapter.getRouter())
app.listen(3000, () => {
  console.log('Running on 3000...')
  console.log('For the UI, open http://localhost:3000/admin/queues')
})
