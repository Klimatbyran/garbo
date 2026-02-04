import { Queue, QueueOptions } from 'bullmq';
import redis from '../config/redis';

export type DiscordJobData = {
  url: string;
  threadId: string;
  channelId?: string;
  messageId?: string;
  autoApprove?: boolean;
  [key: string]: any;
};

export class DiscordQueue {
  queue: Queue;
  
  constructor(name: string, options?: QueueOptions) {
    this.queue = new Queue(name, {
      connection: redis,
      ...options,
    });
  }
  
  async add(name: string, data: DiscordJobData, options?: any) {
    return this.queue.add(name, data, options);
  }
  
  async close() {
    return this.queue.close();
  }
}
