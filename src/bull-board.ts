import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { FastifyAdapter } from '@bull-board/fastify'

import { queues as pipelineQueues } from './queues'
import { PIPELINE_AUTO_RUN_QUEUE } from './queueNames'
import { getSharedQueue } from './lib/getSharedQueue'
import apiConfig from './config/api'

const queues = [
  ...Object.values(pipelineQueues).map(
    (pipelineQueue) => pipelineQueue.queue
  ),
  getSharedQueue(PIPELINE_AUTO_RUN_QUEUE),
]
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
