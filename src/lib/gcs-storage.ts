import { Storage } from '@google-cloud/storage'
import path from 'path'

// Configuration from environment variables
const bucketName = process.env.GCS_BUCKET_NAME || 'klimatkollen-pdfs'
const projectId = process.env.GCS_PROJECT_ID || 'tokyo-apparatus-412712'
const credentialsPath = process.env.GCS_CREDENTIALS_PATH
const pdfBaseUrl = process.env.GCS_PDF_BASE_URL || `https://storage.googleapis.com/${bucketName}/`
const pdfCdnUrl = process.env.GCS_PDF_CDN_URL || `https://cdn.klimatkollen.se/`

// Initialize storage client
const storage = new Storage({
  projectId,
  keyFilename: credentialsPath,
})

const bucket = storage.bucket(bucketName)

/**
 * Upload a file to GCS
 * @param filePath Local file path
 * @param destination Destination path in the bucket
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(filePath: string, destination?: string) {
  const fileName = destination || path.basename(filePath)
  
  try {
    await bucket.upload(filePath, {
      destination: fileName,
      metadata: {
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
    })
    
    return {
      gcsUrl: `${pdfBaseUrl}${fileName}`,
      cdnUrl: `${pdfCdnUrl}${fileName}`,
    }
  } catch (error) {
    console.error('Error uploading file to GCS:', error)
    throw error
  }
}

/**
 * Get a signed URL for a file (for private files)
 * @param fileName File name in the bucket
 * @param expiresInMinutes How long the URL should be valid (default: 60 minutes)
 * @returns Signed URL
 */
export async function getSignedUrl(fileName: string, expiresInMinutes = 60) {
  try {
    const [url] = await bucket.file(fileName).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    })
    
    return url
  } catch (error) {
    console.error('Error generating signed URL:', error)
    throw error
  }
}

/**
 * Delete a file from the bucket
 * @param fileName File name to delete
 */
export async function deleteFile(fileName: string) {
  try {
    await bucket.file(fileName).delete()
    return true
  } catch (error) {
    console.error('Error deleting file from GCS:', error)
    throw error
  }
}

/**
 * List all files in the bucket or a specific prefix
 * @param prefix Optional prefix to filter files
 * @returns Array of file names
 */
export async function listFiles(prefix?: string) {
  try {
    const options: any = {}
    if (prefix) {
      options.prefix = prefix
    }
    
    const [files] = await bucket.getFiles(options)
    return files.map(file => ({
      name: file.name,
      gcsUrl: `${pdfBaseUrl}${file.name}`,
      cdnUrl: `${pdfCdnUrl}${file.name}`,
      size: parseInt(file.metadata.size, 10),
      updated: new Date(file.metadata.updated),
    }))
  } catch (error) {
    console.error('Error listing files from GCS:', error)
    throw error
  }
}

/**
 * Get a public URL for a file
 * @param fileName File name in the bucket
 * @param useCdn Whether to use the CDN URL (default: true)
 * @returns Public URL
 */
export function getPublicUrl(fileName: string, useCdn = true) {
  return useCdn 
    ? `${pdfCdnUrl}${fileName}`
    : `${pdfBaseUrl}${fileName}`
}

export default {
  uploadFile,
  getSignedUrl,
  deleteFile,
  listFiles,
  getPublicUrl,
  bucket,
  storage,
}
