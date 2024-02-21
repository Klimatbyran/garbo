import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { downloadPDF, downloadWebsite } from '../queues';

class JobData extends Job {
  data: {
    url: string
  }
}

const worker = new Worker(
  'checkURL',
  async (job: JobData) => {
    const { url } = job.data
    const fileType = url.endsWith('.pdf') ? 'pdf' : 'webpage'
    if (fileType === 'pdf') {
      job.log('Data is PDF: ' + url)
      downloadPDF.add('download data ' + url, { url })
    } else {
      job.log('Data is website: ' + url)
      downloadWebsite.add('download data ' + url, { url })
    }      
    return { fileType, url }
  },
  {
    connection: redis,
    autorun: false,
  }
);

export default worker;