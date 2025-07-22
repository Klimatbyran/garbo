import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import googleScreenshotBucketConfig from '../../config/googleScreenshotBucket';
import { Storage } from '@google-cloud/storage';
import { createSafeFolderName } from '../../lib/pathUtils';

const storage = new Storage({
  credentials: JSON.parse(Buffer.from(googleScreenshotBucketConfig.bucketKey, 'base64').toString()),
  projectId: JSON.parse(Buffer.from(googleScreenshotBucketConfig.bucketKey, 'base64').toString()).project_id,
});

const screenshotsQuerySchema = z.object({
  url: z.string(),
});

const screenshotsResponseSchema = z.object({
  screenshots: z.array(z.string()),
});

export async function screenshotsReadRoutes(app: FastifyInstance) {
  app.get('/screenshots', {
    schema: {
      summary: 'Get screenshots for a PDF URL',
      description: 'Returns a list of screenshot URLs for a given PDF URL',
      querystring: screenshotsQuerySchema,
      response: {
        200: screenshotsResponseSchema,
      },
    },
  }, async (request: FastifyRequest<{ Querystring: z.infer<typeof screenshotsQuerySchema> }>, reply) => {
    const { url } = request.query;
    console.log(`[screenshots] Fetching screenshots for PDF URL:`, url);
    const decodedUrl = decodeURIComponent(url);
    const safeFolderName = createSafeFolderName(decodedUrl);
    console.log(`[screenshots] Looking for folder in bucket: ${safeFolderName}/`);
    const bucket = storage.bucket(googleScreenshotBucketConfig.bucketName);
    const [files] = await bucket.getFiles({ prefix: `${safeFolderName}/` });
    const screenshots = await Promise.all(
      files
        .filter(file => file.name.endsWith('.png'))
        .map(async file => {
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60, // 1 hour
          });
          return signedUrl;
        })
    );
    reply.send({ screenshots });
  });
} 