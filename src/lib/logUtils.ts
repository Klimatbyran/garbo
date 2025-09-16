import { appendFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export const logToFile = (message: string, data: any, jobId?: string, logFileName: string = 'general.log') => {
  const logsDir = join(process.cwd(), 'logs')
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true })
  }
  
  const timestamp = new Date().toISOString()
  const jobPrefix = jobId ? `[Job ${jobId}] ` : ''
  const logEntry = `\n=== ${timestamp} ${jobPrefix}${message} ===\n${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}\n`
  
  const logFile = join(logsDir, logFileName)
  appendFileSync(logFile, logEntry, 'utf8')
} 