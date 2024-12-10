import express from 'express'

import queue from './queue'
import discord from './discord'
import api from './api'
import apiConfig from './config/api'

const port = apiConfig.port
const app = express()

app.get('/favicon.ico', express.static('public/favicon.png'))
app.use('/api', api)
app.use('/admin/queues', queue)

app.get('/', (req, res) => {
  res.redirect('/api')
})

app.listen(port, () => {
  console.log(`Running on ${port}...`)
  console.log(`For the UI, open http://localhost:${port}/admin/queues`)
  discord.login()
})
