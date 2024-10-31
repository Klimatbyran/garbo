import 'dotenv/config'
import express from 'express'
import queue from './queue'

import discord from './discord'
import api from './api'

const port = process.env.PORT || 3000
const app = express()

app.get('/favicon.ico', express.static('public/favicon.png'))
app.use('/api', api)
app.use('/admin/queues', queue)

app.get('/', (req, res) => {
  res.send(
    `Hi I'm Garbo!
    Queues: <br>
    <a href="/admin/queues">/admin/queues</a>`
  )
})

app.listen(port, () => {
  console.log(`Running on ${port}...`)
  console.log(`For the UI, open http://localhost:${port}/admin/queues`)
  discord.login()
})
