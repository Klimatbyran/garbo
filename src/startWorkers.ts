import discord from './discord'
import { workers } from './workers'

console.log('Starting workers...')

Promise.all(workers.map((worker) => {return worker.run()}))
  .then((results) => results.join('\n'))
  .then(console.log)
  .catch((error) => {
    console.error('Error starting workers:', error);
    process.exit(1);
  });

async function connectWithRetry<T>(fn: () => Promise<T>, maxRetries = 5, delay = 1000): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const error = err as Error;
      console.log(`Connection attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  throw new Error('Failed to connect after maximum retries');
}

try {
  await connectWithRetry(() => discord.login());
  console.log('Discord bot started');
} catch (error) {
  console.error('Failed to start Discord bot:', error);
  process.exit(1);
}
