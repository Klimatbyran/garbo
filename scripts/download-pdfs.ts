import { exec } from 'child_process'
import { promisify } from 'util'
import { isMainModule } from './utils.js'
import { createPublicBucket } from './setup-gcs-bucket.js'
import { mkdir, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, basename } from 'path'
import fetch from 'node-fetch'

const execAsync = promisify(exec)

// Configuration
const API_URL = 'https://api.klimatkollen.se/api'
const BUCKET_NAME = 'klimatkollen-pdfs'
const TEMP_DIR = join(process.cwd(), 'temp-pdfs')
const MAX_CONCURRENT_DOWNLOADS = 5

/**
 * Fetch all companies from the API
 */
async function fetchCompanies() {
  console.log('Fetching companies from API...')
  const response = await fetch(`${API_URL}/companies/`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch companies: ${response.statusText}`)
  }
  
  return await response.json()
}

/**
 * Extract all PDF URLs from company reporting periods
 */
function extractPdfUrls(companies) {
  console.log('Extracting PDF URLs from company data...')
  const pdfUrls = []
  
  for (const company of companies) {
    const { name, wikidataId, reportingPeriods } = company
    
    if (!reportingPeriods || !Array.isArray(reportingPeriods)) {
      continue
    }
    
    for (const period of reportingPeriods) {
      if (period.reportURL && period.reportURL.toLowerCase().endsWith('.pdf')) {
        pdfUrls.push({
          url: period.reportURL,
          companyName: name,
          wikidataId,
          year: new Date(period.endDate).getFullYear()
        })
      }
    }
  }
  
  console.log(`Found ${pdfUrls.length} PDF URLs`)
  return pdfUrls
}

/**
 * Download a PDF file to the temp directory
 */
async function downloadPdf(pdfInfo) {
  const { url, companyName, wikidataId, year } = pdfInfo
  
  try {
    // Create a safe filename
    const safeCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_')
    const originalFilename = basename(url)
    const filename = `${safeCompanyName}_${wikidataId}_${year}_${originalFilename}`
    const filepath = join(TEMP_DIR, filename)
    
    console.log(`Downloading ${url} to ${filepath}`)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`)
    }
    
    const buffer = await response.buffer()
    await writeFile(filepath, buffer)
    
    return {
      filepath,
      filename,
      ...pdfInfo
    }
  } catch (error) {
    console.error(`Error downloading ${url}:`, error.message)
    return null
  }
}

/**
 * Download PDFs in batches to avoid overwhelming the server
 */
async function downloadPdfs(pdfUrls) {
  console.log(`Downloading ${pdfUrls.length} PDFs...`)
  
  // Create temp directory if it doesn't exist
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true })
  }
  
  const results = []
  
  // Process in batches
  for (let i = 0; i < pdfUrls.length; i += MAX_CONCURRENT_DOWNLOADS) {
    const batch = pdfUrls.slice(i, i + MAX_CONCURRENT_DOWNLOADS)
    const batchResults = await Promise.all(batch.map(downloadPdf))
    results.push(...batchResults.filter(Boolean))
    
    console.log(`Downloaded ${results.length}/${pdfUrls.length} PDFs`)
    
    // Small delay to avoid overwhelming the server
    if (i + MAX_CONCURRENT_DOWNLOADS < pdfUrls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}

/**
 * Upload a PDF to the GCS bucket
 */
async function uploadPdfToGcs(pdfInfo) {
  const { filepath, filename } = pdfInfo
  
  try {
    console.log(`Uploading ${filename} to GCS bucket...`)
    
    // Upload to GCS
    await execAsync(`gcloud storage cp ${filepath} gs://${BUCKET_NAME}/${filename}`)
    
    // Generate the public URL
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`
    const customDomainUrl = `https://cdn.klimatkollen.se/${filename}`
    
    return {
      ...pdfInfo,
      gcsUrl: publicUrl,
      cdnUrl: customDomainUrl
    }
  } catch (error) {
    console.error(`Error uploading ${filename} to GCS:`, error.message)
    return null
  }
}

/**
 * Upload all downloaded PDFs to GCS
 */
async function uploadPdfsToGcs(downloadedPdfs) {
  console.log(`Uploading ${downloadedPdfs.length} PDFs to GCS...`)
  
  const results = []
  
  // Process in batches
  for (let i = 0; i < downloadedPdfs.length; i += MAX_CONCURRENT_DOWNLOADS) {
    const batch = downloadedPdfs.slice(i, i + MAX_CONCURRENT_DOWNLOADS)
    const batchResults = await Promise.all(batch.map(uploadPdfToGcs))
    results.push(...batchResults.filter(Boolean))
    
    console.log(`Uploaded ${results.length}/${downloadedPdfs.length} PDFs`)
    
    // Small delay to avoid overwhelming the server
    if (i + MAX_CONCURRENT_DOWNLOADS < downloadedPdfs.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}

/**
 * Generate a report of the uploaded PDFs
 */
async function generateReport(uploadedPdfs) {
  console.log('Generating report...')
  
  const reportPath = join(process.cwd(), 'pdf-cdn-report.json')
  
  const report = {
    totalPdfs: uploadedPdfs.length,
    timestamp: new Date().toISOString(),
    pdfs: uploadedPdfs.map(pdf => ({
      companyName: pdf.companyName,
      wikidataId: pdf.wikidataId,
      year: pdf.year,
      originalUrl: pdf.url,
      gcsUrl: pdf.gcsUrl,
      cdnUrl: pdf.cdnUrl
    }))
  }
  
  await writeFile(reportPath, JSON.stringify(report, null, 2))
  console.log(`Report saved to ${reportPath}`)
  
  return reportPath
}

/**
 * Main function
 */
async function main() {
  try {
    // Ensure bucket exists
    await createPublicBucket()
    
    // Fetch companies and extract PDF URLs
    const companies = await fetchCompanies()
    const pdfUrls = extractPdfUrls(companies)
    
    if (pdfUrls.length === 0) {
      console.log('No PDF URLs found. Exiting.')
      return
    }
    
    // Download PDFs
    const downloadedPdfs = await downloadPdfs(pdfUrls)
    console.log(`Successfully downloaded ${downloadedPdfs.length} PDFs`)
    
    if (downloadedPdfs.length === 0) {
      console.log('No PDFs were downloaded successfully. Exiting.')
      return
    }
    
    // Upload PDFs to GCS
    const uploadedPdfs = await uploadPdfsToGcs(downloadedPdfs)
    console.log(`Successfully uploaded ${uploadedPdfs.length} PDFs to GCS`)
    
    // Generate report
    const reportPath = await generateReport(uploadedPdfs)
    
    console.log('\n🎉 Process completed successfully!')
    console.log(`Downloaded and uploaded ${uploadedPdfs.length}/${pdfUrls.length} PDFs`)
    console.log(`Bucket URL: https://storage.googleapis.com/${BUCKET_NAME}/`)
    console.log(`Custom domain: https://cdn.klimatkollen.se/ (if DNS is configured)`)
    console.log(`Report: ${reportPath}`)
    
    // Clean up temp directory
    console.log('\nTo clean up the temporary PDF directory, run:')
    console.log(`rm -rf ${TEMP_DIR}`)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

// Run the script if it's called directly
if (isMainModule(import.meta.url)) {
  main()
}

export { fetchCompanies, extractPdfUrls, downloadPdfs, uploadPdfsToGcs }
