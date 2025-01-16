import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { FastifyAdapter } from '@bull-board/fastify'

import { workers } from './workers'
import apiConfig from './config/api'

const queues = workers.map((worker) => worker.queue)
const serverAdapter = new FastifyAdapter()
serverAdapter.setBasePath(apiConfig.bullBoardBasePath)

createBullBoard({
  queues: queues.map((queue) => new BullMQAdapter(queue)),
  serverAdapter,
  options: {
    uiConfig: {
      boardTitle: 'Klimatkollen',
    },
  },
})

export default serverAdapter.registerPlugin()
