import express from 'express'
import { parseArgs } from 'node:util'

import api from './api'
import apiConfig from './config/api'

const { values } = parseArgs({
  options: {
    'api-only': {
      type: 'boolean',
      default: false,
    },
  },
})

const START_BOARD = !values['api-only']

const port = apiConfig.port
const app = express()

app.get('/favicon.ico', express.static('public/favicon.png'))
app.use('/api', api)

app.get('/', (req, res) => {
  res.redirect('/api')
})

if (START_BOARD) {
  const queue = (await import('./queue')).default
  app.use('/admin/queues', queue)
  app.get('/', (req, res) => {
    res.send(
      `Hi I'm Garbo!
      Queues: <br>
      <a href="/admin/queues">/admin/queues</a>`
    )
  })
}

app.listen(port, async () => {
  console.log(`API running at http://localhost:${port}/api/companies`)

  if (START_BOARD) {
    const discord = (await import('./discord')).default
    console.log(`For the UI, open http://localhost:${port}/admin/queues`)
    discord.login()
  }
})
