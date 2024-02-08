import { flowProducer } from '../queues/decisionQueues';

export async function enqueueNextJob(jobName: string, data: object) {
  const nextJob = {
    name: jobName,
    data,
    queueName: `${jobName}Queue`,
  };

  await flowProducer.add({
    name: 'conditionalFlow',
    queueName: 'conditionalFlowQueue',
    data: {},
    children: [nextJob],
  });
}
