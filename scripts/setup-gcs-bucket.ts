import { exec } from 'child_process'
import { promisify } from 'util'
import { resolve } from 'path'
import { readFile } from 'fs/promises'

const execAsync = promisify(exec)

// Configuration
const BUCKET_NAME = 'klimatkollen-pdfs'
const BUCKET_LOCATION = 'europe-north1' // Stockholm region
const TEST_PDF_PATH = resolve('test-files/sample.pdf')

/**
 * Creates a GCS bucket with public read access
 */
async function createPublicBucket() {
  try {
    console.log(`Creating bucket: ${BUCKET_NAME}...`)
    
    // Create the bucket
    await execAsync(`gcloud storage buckets create gs://${BUCKET_NAME} --location=${BUCKET_LOCATION}`)
    
    // Make bucket publicly readable
    await execAsync(`gcloud storage buckets add-iam-policy-binding gs://${BUCKET_NAME} --member=allUsers --role=roles/storage.objectViewer`)
    
    console.log(`✅ Bucket ${BUCKET_NAME} created with public read access`)
  } catch (error) {
    console.error('Error creating bucket:', error)
    if (error.stderr?.includes('already exists')) {
      console.log('Bucket already exists, continuing...')
    } else {
      throw error
    }
  }
}

/**
 * Uploads a test PDF file to the bucket
 */
async function uploadTestFile() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const destFileName = `test-${timestamp}.pdf`
    
    console.log(`Uploading test file to gs://${BUCKET_NAME}/${destFileName}...`)
    
    // Upload the file with public-read ACL
    await execAsync(`gcloud storage cp ${TEST_PDF_PATH} gs://${BUCKET_NAME}/${destFileName}`)
    
    // Generate the public URL
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${destFileName}`
    
    console.log(`✅ File uploaded successfully!`)
    console.log(`📄 Public URL: ${publicUrl}`)
    
    return publicUrl
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

/**
 * Lists all files in the bucket
 */
async function listBucketFiles() {
  try {
    console.log(`Listing files in bucket gs://${BUCKET_NAME}...`)
    const { stdout } = await execAsync(`gcloud storage ls gs://${BUCKET_NAME}`)
    console.log(stdout || 'No files found')
  } catch (error) {
    console.error('Error listing files:', error)
    throw error
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Check if user is logged in
    const { stdout: projectInfo } = await execAsync('gcloud config get-value project')
    console.log(`Using GCP project: ${projectInfo.trim()}`)
    
    await createPublicBucket()
    await uploadTestFile()
    await listBucketFiles()
    
    console.log('\n🎉 Setup complete! Your bucket is ready for use as a CDN for PDFs.')
    console.log(`Bucket URL: https://storage.googleapis.com/${BUCKET_NAME}/`)
  } catch (error) {
    console.error('Setup failed:', error)
    process.exit(1)
  }
}

// Run the script if it's called directly
if (require.main === module) {
  main()
}

export { createPublicBucket, uploadTestFile, listBucketFiles }
