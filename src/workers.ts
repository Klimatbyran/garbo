import { Queue } from 'bullmq'
import fs from 'fs'
import redis from './config/redis'

const options = { connection: redis }

export const workers = getWorkerFiles('src/workers').map((file) => {
  // Replace slashes with underscores and remove .ts extension
  let name = file.replace(/\.ts$/, '').replace(/\//g, '_')

  if (name.includes('_')) {
    const nameParts = name.split('_')
    const lastPart = nameParts[nameParts.length - 1]
    const capitalizedLastPart =
      lastPart.charAt(0).toUpperCase() + lastPart.slice(1)
    nameParts[nameParts.length - 1] = capitalizedLastPart
    name = nameParts.join('')
  }

  return {
    name,
    queue: new Queue(name, options),
    run: async () => {
      await import(`./workers/${file}`)
      return file.replace(/\.ts$/, '')
    },
  }
})

function getWorkerFiles(dir: string, baseDir: string = dir): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((dirent) => {
    const path = `${dir}/${dirent.name}`
    if (dirent.isDirectory()) {
      return getWorkerFiles(path, baseDir)
    } else if (dirent.name.endsWith('.ts')) {
      return [path.slice(baseDir.length + 1)]
    } else {
      return []
    }
  })
}
