import { Worker, Job } from 'bullmq'
import redisConfig from '../../config/redis'
import { crawlURL, downloadPDF } from '../../queues'

class JobData extends Job {
  data: {
    channelId: string
    messageId: string
    url: string
  }
}

const worker = new Worker(
  'flowStarter',
  async (job: JobData) => {
    const data = job.data;
    const response = await fetch(data.url);

    if (response.headers.get('content-type') === 'application/pdf') {
        downloadPDF.add('downloadPDF', data);
    } else {
        crawlURL.add('crawlURL', data);
    }
  },
  {
    connection: redisConfig,
    autorun: false,
  }
)

export default worker
