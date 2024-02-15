import { FlowProducer } from 'bullmq';
import redisConfig from '../config/redis';

const testFlow = async (channelId: string, messageId: string) => {
  const flowProducer = new FlowProducer({ connection: redisConfig });

  await flowProducer.add({
    name: 'testFlow',
    queueName: 'testFlowQueue',
    data: { message: 'Starting test flow...', channelId, messageId },
    children: [
      {
        name: 'testStep1',
        data: { step: 1, channelId, messageId },
        queueName: 'testStep1Queue',
        children: [
          {
            name: 'testStep2',
            data: { step: 2, channelId, messageId },
            queueName: 'testStep2Queue'
          }
        ]
      },
    ],
  });
};

export default testFlow;