import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import googleScreenshotBucketConfig from '@/config/googleScreenshotBucket';
import { Storage } from '@google-cloud/storage';
import { createSafeFolderName } from '@/lib/pathUtils';
import { getTags } from '@/config/openapi';

const credentials = JSON.parse(Buffer.from(googleScreenshotBucketConfig.bucketKey, 'base64').toString());
const storage = new Storage({
  credentials,
  projectId: credentials.project_id,
});

const screenshotsQuerySchema = z.object({
  url: z.string().url('Invalid URL format').refine(
    (url) => url.toLowerCase().endsWith('.pdf'),
    'URL must point to a PDF file'
  ),
});

const screenshotsResponseSchema = z.object({
  screenshots: z.array(z.string()),
});

export async function screenshotsReadRoutes(app: FastifyInstance) {
  app.get('/screenshots', {
    schema: {
      summary: 'Get screenshots for a PDF URL',
      description: 'Returns a list of screenshot URLs for a given PDF URL',
      tags: getTags('Screenshots'),
      querystring: screenshotsQuerySchema,
      response: {
        200: screenshotsResponseSchema,
      },
    },
  }, async (request: FastifyRequest<{ Querystring: z.infer<typeof screenshotsQuerySchema> }>, reply) => {
    try {
      const { url } = request.query;
      
      const decodedUrl = decodeURIComponent(url);
      const safeFolderName = createSafeFolderName(decodedUrl);
      
      const bucket = storage.bucket(googleScreenshotBucketConfig.bucketName);
      const [files] = await bucket.getFiles({ prefix: `${safeFolderName}/` });
      
      const pngFiles = files.filter(file => file.name.endsWith('.png'));
      
      const screenshots = await Promise.all(
        pngFiles.map(async file => {
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60, // 1 hour
          });
          return signedUrl;
        })
      );
      
      reply.send({ screenshots });
      
    } catch (error) {
      console.error('Get screenshots error:', error);
      return reply
        .status(500)
        .send({ error: 'Failed to fetch screenshots' });
    }
  });
} 