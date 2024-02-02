import { FlowProducer } from 'bullmq';
import redisConfig from '../config/redis';

export async function startTestFlow(channelId: string, messageId: string) {
  const flowProducer = new FlowProducer({ connection: redisConfig });

  const flow = {
    name: 'testProcessFlow',
    queueName: 'testProcess',
    data: { channelId, messageId }, // Data passed to all jobs in the flow, messageId is used to update the same message
    children: [
      {
        name: 'step1',
        data: { stepMessage: 'Step 1 Processing' },
        queueName: 'testStep1',
        children: [
          {
            name: 'step2',
            data: { stepMessage: 'Step 2 Processing' },
            queueName: 'testStep2',
            children: [
              {
                name: 'step3',
                data: { stepMessage: 'Step 3 Processing' },
                queueName: 'testStep3',
              },
            ],
          },
        ],
      },
    ],
  };

  await flowProducer.add(flow);
}
