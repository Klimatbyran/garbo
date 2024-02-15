import { FlowProducer } from 'bullmq';
import redisConfig from '../config/redis';

const manualReviewFlow = async (data: any) => {
  const flowProducer = new FlowProducer({ connection: redisConfig });

  await flowProducer.add({
    name: 'ManualReviewFlow',
    queueName: 'manualReviewFlowQueue',
    data: { message: 'Initiating manual review flow', ...data },
    children: [
      {
        name: 'CreateEmissionsImage',
        data: { part: 'image-creation', ...data },
        queueName: 'createEmissionsImageQueue',
        children: [
          {
            name: 'AskManualReview',
            data: { part: 'manual-review', ...data },
            queueName: 'askManualReviewQueue',
            children: [
              {
                name: 'SaveToDB',
                data: { part: 'save-to-db', ...data },
                queueName: 'saveToDBQueue'
              }
            ]
          }
        ]
      }
    ],
  });
};

export default manualReviewFlow;