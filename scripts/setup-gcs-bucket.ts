import { exec } from 'child_process'
import { promisify } from 'util'
import { resolve } from 'path'
import { isMainModule } from './utils.js'
import { writeFile } from 'fs/promises'

const execAsync = promisify(exec)

// Configuration
const BUCKET_NAME = 'klimatkollen-pdfs'
const PROJECT_ID = 'tokyo-apparatus-412712' // Your project ID
const BUCKET_LOCATION = 'europe-north1' // Stockholm region
const TEST_PDF_PATH = resolve('test-files/sample.pdf')
const CUSTOM_DOMAIN = 'cdn.klimatkollen.se'

// Ensure the test PDF exists
async function ensureTestPdfExists() {
  try {
    // Create a minimal valid PDF file if it doesn't exist
    const minimalPdf = `%PDF-1.4
1 0 obj
<</Type/Catalog/Pages 2 0 R>>
endobj
2 0 obj
<</Type/Pages/Kids[3 0 R]/Count 1>>
endobj
3 0 obj
<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>>>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000052 00000 n 
0000000101 00000 n 
trailer
<</Size 4/Root 1 0 R>>
startxref
178
%%EOF`

    await writeFile(TEST_PDF_PATH, minimalPdf)
    console.log(`Created test PDF at ${TEST_PDF_PATH}`)
  } catch (error) {
    console.error('Error creating test PDF:', error)
    throw error
  }
}

/**
 * Creates a GCS bucket with public read access
 */
async function createPublicBucket() {
  try {
    console.log(`Creating bucket: ${BUCKET_NAME}...`)
    
    try {
      // Create the bucket
      await execAsync(`gcloud storage buckets create gs://${BUCKET_NAME} --location=${BUCKET_LOCATION}`)
      console.log(`✅ Bucket ${BUCKET_NAME} created successfully`)
    } catch (createError) {
      // Check if the bucket already exists
      if (createError.stderr?.includes('already exists') || 
          createError.stderr?.includes('HTTPError 409') || 
          createError.stderr?.includes('You already own it')) {
        console.log(`✅ Bucket ${BUCKET_NAME} already exists, continuing...`)
      } else {
        // If it's a different error, rethrow it
        throw createError
      }
    }
    
    // Make bucket publicly readable (do this regardless of whether we just created it or not)
    await execAsync(`gcloud storage buckets add-iam-policy-binding gs://${BUCKET_NAME} --member=allUsers --role=roles/storage.objectViewer`)
    console.log(`✅ Bucket ${BUCKET_NAME} configured with public read access`)
    
    return true
  } catch (error) {
    console.error('Error configuring bucket:', error)
    throw error
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
 * Configure custom domain for the bucket
 */
async function setupCustomDomain() {
  try {
    console.log(`\nSetting up custom domain ${CUSTOM_DOMAIN} for bucket ${BUCKET_NAME}...`)
    
    // Step 1: Verify domain ownership
    console.log(`\n1. You need to verify domain ownership with Google Cloud:`)
    console.log(`   Visit: https://console.cloud.google.com/apis/credentials/domainverification`)
    console.log(`   Add domain: klimatkollen.se`)
    
    try {
      // Step 2: Configure the bucket for website hosting
      await execAsync(`gcloud storage buckets update gs://${BUCKET_NAME} --web-main-page-suffix=index.html --web-error-page=404.html`)
      console.log(`\n✅ Bucket configured for website hosting`)
    } catch (error) {
      console.warn(`⚠️ Warning: Could not configure website hosting: ${error.message}`)
      console.log(`   You may need to configure website hosting manually in the Google Cloud Console.`)
    }
    
    // Step 3: Provide DNS configuration instructions
    console.log(`\n2. Add this CNAME record to your DNS settings:`)
    console.log(`   Name: cdn`)
    console.log(`   Type: CNAME`)
    console.log(`   Value: c.storage.googleapis.com`)
    console.log(`   TTL: 3600 (or as recommended by your DNS provider)`)
    
    console.log(`\n3. After DNS propagation (can take up to 24-48 hours):`)
    console.log(`   Your files will be accessible at: https://${CUSTOM_DOMAIN}/FILENAME`)
    
    return true
  } catch (error) {
    console.error('Error setting up custom domain:', error)
    return false
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
    
    // Make sure we have a test PDF
    await ensureTestPdfExists()
    
    // Create bucket
    let bucketCreated = false
    try {
      bucketCreated = await createPublicBucket()
    } catch (error) {
      console.error('Error in bucket creation step, but continuing with other steps:', error.message)
    }
    
    // Upload file if bucket exists
    let fileUploaded = false
    try {
      await uploadTestFile()
      fileUploaded = true
    } catch (error) {
      console.error('Error uploading test file:', error.message)
    }
    
    // List files if previous steps succeeded
    if (bucketCreated || fileUploaded) {
      try {
        await listBucketFiles()
      } catch (error) {
        console.error('Error listing files:', error.message)
      }
    }
    
    // Setup custom domain
    let customDomainSetup = false
    try {
      customDomainSetup = await setupCustomDomain()
    } catch (error) {
      console.error('Error setting up custom domain:', error.message)
    }
    
    console.log('\n🎉 Setup complete! Your bucket is ready for use as a CDN for PDFs.')
    console.log(`Bucket URL: https://storage.googleapis.com/${BUCKET_NAME}/`)
    
    if (customDomainSetup) {
      console.log(`Custom domain: https://${CUSTOM_DOMAIN}/ (after DNS propagation)`)
    }
    
    console.log(`\nTo use this bucket in your application, you can:`)
    console.log(`1. Upload files: gcloud storage cp LOCAL_FILE gs://${BUCKET_NAME}/REMOTE_PATH`)
    console.log(`2. Access files via GCS: https://storage.googleapis.com/${BUCKET_NAME}/REMOTE_PATH`)
    if (customDomainSetup) {
      console.log(`   or via custom domain: https://${CUSTOM_DOMAIN}/REMOTE_PATH (after DNS setup)`)
    }
  } catch (error) {
    console.error('Setup failed:', error)
    process.exit(1)
  }
}

// Run the script if it's called directly
if (isMainModule(import.meta.url)) {
  main()
}

export { createPublicBucket, uploadTestFile, listBucketFiles }
