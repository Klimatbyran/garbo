import { exec } from 'child_process'
import { promisify } from 'util'
import { isMainModule } from './utils.js'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

const execAsync = promisify(exec)

// Configuration
const BUCKET_NAME = 'klimatkollen-pdfs'
const PROJECT_ID = 'tokyo-apparatus-412712'
const SERVICE_ACCOUNT_NAME = 'klimatkollen-pdf-service'
const SERVICE_ACCOUNT_DISPLAY_NAME = 'Klimatkollen PDF Service Account'
const SERVICE_ACCOUNT_DESCRIPTION = 'Service account for accessing PDFs in the Klimatkollen bucket'
const KEYS_DIR = join(process.cwd(), 'secrets')

/**
 * Create a service account for bucket access
 */
async function createServiceAccount() {
  try {
    console.log(`Creating service account: ${SERVICE_ACCOUNT_NAME}...`)
    
    try {
      await execAsync(`gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
        --display-name="${SERVICE_ACCOUNT_DISPLAY_NAME}" \
        --description="${SERVICE_ACCOUNT_DESCRIPTION}" \
        --project=${PROJECT_ID}`)
      console.log(`✅ Service account ${SERVICE_ACCOUNT_NAME} created successfully`)
    } catch (error) {
      if (error.stderr?.includes('already exists')) {
        console.log(`✅ Service account ${SERVICE_ACCOUNT_NAME} already exists, continuing...`)
      } else {
        throw error
      }
    }
    
    const serviceAccountEmail = `${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com`
    return serviceAccountEmail
  } catch (error) {
    console.error('Error creating service account:', error)
    throw error
  }
}

/**
 * Grant the service account access to the bucket
 */
async function grantBucketAccess(serviceAccountEmail) {
  try {
    console.log(`Granting ${serviceAccountEmail} access to bucket ${BUCKET_NAME}...`)
    
    // Grant storage object admin role to the service account for this bucket
    await execAsync(`gcloud storage buckets add-iam-policy-binding gs://${BUCKET_NAME} \
      --member="serviceAccount:${serviceAccountEmail}" \
      --role="roles/storage.objectAdmin"`)
    
    console.log(`✅ Granted storage object admin permissions to ${serviceAccountEmail}`)
    return true
  } catch (error) {
    console.error('Error granting bucket access:', error)
    throw error
  }
}

/**
 * Create and download a key for the service account
 */
async function createServiceAccountKey(serviceAccountEmail) {
  try {
    // Create directory for keys if it doesn't exist
    if (!existsSync(KEYS_DIR)) {
      await mkdir(KEYS_DIR, { recursive: true })
    }
    
    const keyPath = join(KEYS_DIR, `${SERVICE_ACCOUNT_NAME}-key.json`)
    console.log(`Creating service account key at ${keyPath}...`)
    
    await execAsync(`gcloud iam service-accounts keys create ${keyPath} \
      --iam-account=${serviceAccountEmail}`)
    
    console.log(`✅ Service account key created at ${keyPath}`)
    return keyPath
  } catch (error) {
    console.error('Error creating service account key:', error)
    throw error
  }
}

/**
 * Generate Kubernetes secret YAML
 */
async function generateKubernetesSecret(keyPath) {
  try {
    // Read the key file
    const { stdout: keyFileContent } = await execAsync(`cat ${keyPath} | base64`)
    
    const secretYaml = `apiVersion: v1
kind: Secret
metadata:
  name: gcs-pdf-credentials
type: Opaque
data:
  gcs-key.json: ${keyFileContent.trim()}
  BUCKET_NAME: ${Buffer.from(BUCKET_NAME).toString('base64')}
  PROJECT_ID: ${Buffer.from(PROJECT_ID).toString('base64')}
`
    
    const secretPath = join(KEYS_DIR, 'gcs-pdf-credentials.yaml')
    await writeFile(secretPath, secretYaml)
    
    console.log(`✅ Kubernetes secret YAML created at ${secretPath}`)
    return secretPath
  } catch (error) {
    console.error('Error generating Kubernetes secret:', error)
    throw error
  }
}

/**
 * Generate environment variables for local development
 */
async function generateEnvFile(keyPath) {
  try {
    const envContent = `# GCS PDF Storage Configuration
GCS_BUCKET_NAME=${BUCKET_NAME}
GCS_PROJECT_ID=${PROJECT_ID}
GCS_CREDENTIALS_PATH=${keyPath}
GCS_PDF_BASE_URL=https://storage.googleapis.com/${BUCKET_NAME}/
GCS_PDF_CDN_URL=https://cdn.klimatkollen.se/
`
    
    const envPath = join(KEYS_DIR, 'gcs-pdf.env')
    await writeFile(envPath, envContent)
    
    console.log(`✅ Environment variables file created at ${envPath}`)
    return envPath
  } catch (error) {
    console.error('Error generating env file:', error)
    throw error
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Extracting GCS bucket credentials for Kubernetes...')
    
    // Create service account
    const serviceAccountEmail = await createServiceAccount()
    
    // Grant bucket access
    await grantBucketAccess(serviceAccountEmail)
    
    // Create service account key
    const keyPath = await createServiceAccountKey(serviceAccountEmail)
    
    // Generate Kubernetes secret
    const secretPath = await generateKubernetesSecret(keyPath)
    
    // Generate env file for local development
    const envPath = await generateEnvFile(keyPath)
    
    console.log('\n🎉 GCS credentials extraction complete!')
    console.log('\nCredentials summary:')
    console.log(`- Service Account: ${serviceAccountEmail}`)
    console.log(`- Key File: ${keyPath}`)
    console.log(`- Kubernetes Secret YAML: ${secretPath}`)
    console.log(`- Environment Variables: ${envPath}`)
    
    console.log('\nTo apply the Kubernetes secret:')
    console.log(`kubectl apply -f ${secretPath}`)
    
    console.log('\nTo use in your application:')
    console.log('1. Mount the secret as a volume in your pod')
    console.log('2. Set the GCS_CREDENTIALS_PATH environment variable to the mounted path')
    console.log('3. Set GCS_BUCKET_NAME and GCS_PROJECT_ID environment variables')
    
    console.log('\nSecurity note:')
    console.log('Keep the key file secure and do not commit it to version control.')
    console.log('Consider adding the secrets/ directory to your .gitignore file.')
  } catch (error) {
    console.error('Error extracting GCS credentials:', error)
    process.exit(1)
  }
}

// Run the script if it's called directly
if (isMainModule(import.meta.url)) {
  main()
}

export { createServiceAccount, grantBucketAccess, createServiceAccountKey }
