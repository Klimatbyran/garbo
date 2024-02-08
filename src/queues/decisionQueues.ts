import { Queue } from 'bullmq';
import { FlowProducer } from 'bullmq';
import redisConfig from '../config/redis';

export const decisionQueue = new Queue('decisionQueue', { connection: redisConfig });
export const evenJobQueue = new Queue('evenJobQueue', { connection: redisConfig });
export const oddJobQueue = new Queue('oddJobQueue', { connection: redisConfig });

export const flowProducer = new FlowProducer({ connection: redisConfig });
