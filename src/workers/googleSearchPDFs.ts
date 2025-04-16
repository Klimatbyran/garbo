import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { FlowProducer } from 'bullmq'
import redis from '../config/redis'
import { QUEUE_NAMES } from '../queues'
import fetch from 'node-fetch'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { resolve } from 'path'
import { existsSync } from 'fs'

// Define the structure for search results
interface GoogleSearchResult {
  link: string;
  title: string;
  snippet: string;
}

interface SearchResponse {
  items: GoogleSearchResult[];
}

// Define the job type
export class GoogleSearchPDFsJob extends DiscordJob {
  declare data: DiscordJob['data'] & {
    searchQuery?: string;
    previousResults?: string[];
  }
}

const flow = new FlowProducer({ connection: redis })
const CACHE_DIR = resolve('cache')
const RESULTS_FILE = resolve(CACHE_DIR, 'pdf-search-results.json')

// Ensure cache directory exists
async function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    await mkdir(CACHE_DIR, { recursive: true })
  }
}

// Load previous results from cache
async function loadPreviousResults(): Promise<string[]> {
  try {
    await ensureCacheDir()
    if (existsSync(RESULTS_FILE)) {
      const data = await readFile(RESULTS_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading previous results:', error)
  }
  return []
}

// Save results to cache
async function saveResults(results: string[]) {
  try {
    await ensureCacheDir()
    await writeFile(RESULTS_FILE, JSON.stringify(results, null, 2), 'utf8')
  } catch (error) {
    console.error('Error saving results:', error)
  }
}

// Search Google for PDFs
async function searchGoogleForPDFs(query: string): Promise<GoogleSearchResult[]> {
  // This uses the Google Custom Search API
  
  const apiKey = process.env.GOOGLE_API_KEY
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID
  
  if (!apiKey || !searchEngineId) {
    throw new Error('Google API key or Search Engine ID not configured')
  }
  
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&fileType=pdf`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Google search failed: ${response.statusText}`)
  }
  
  const data = await response.json() as SearchResponse
  return data.items || []
}

const googleSearchPDFs = new DiscordWorker<GoogleSearchPDFsJob>(
  QUEUE_NAMES.GOOGLE_SEARCH_PDFS,
  async (job) => {
    const { searchQuery = "hållbarhetsrapport 2024 type:pdf" } = job.data
    
    job.log(`Searching Google for: ${searchQuery}`)
    await job.sendMessage(`🔍 Söker efter nya hållbarhetsrapporter med sökning: "${searchQuery}"`)
    
    try {
      // Load previous results
      const previousResults = job.data.previousResults || await loadPreviousResults()
      job.log(`Loaded ${previousResults.length} previous results`)
      
      // Search Google
      const searchResults = await searchGoogleForPDFs(searchQuery)
      job.log(`Found ${searchResults.length} search results`)
      
      // Filter for PDF links
      const pdfLinks = searchResults
        .filter(result => {
          // Check if the link ends with .pdf or has mime type application/pdf
          return result.link.toLowerCase().endsWith('.pdf') || 
                 result.mime === 'application/pdf' ||
                 result.fileFormat === 'PDF/Adobe Acrobat'
        })
        .map(result => result.link)
      
      // Find new PDFs
      const newPDFs = pdfLinks.filter(link => !previousResults.includes(link))
      job.log(`Found ${newPDFs.length} new PDFs`)
      
      if (newPDFs.length > 0) {
        await job.sendMessage(`✅ Hittade ${newPDFs.length} nya hållbarhetsrapporter!`)
        
        // Process each new PDF
        for (const pdfUrl of newPDFs) {
          job.log(`Processing new PDF: ${pdfUrl}`)
          await job.sendMessage(`🔄 Bearbetar ny rapport: ${pdfUrl}`)
          
          // Add to nlmParsePDF queue
          await flow.add({
            name: `Parse PDF ${pdfUrl.slice(-20)}`,
            queueName: QUEUE_NAMES.NLM_PARSE_PDF,
            data: {
              url: pdfUrl,
              threadId: job.data.threadId,
              channelId: job.data.channelId,
            },
          })
        }
        
        // Save updated results
        const allResults = [...previousResults, ...newPDFs]
        await saveResults(allResults)
        
        return { newPDFs, totalProcessed: newPDFs.length }
      } else {
        await job.sendMessage(`ℹ️ Inga nya hållbarhetsrapporter hittades.`)
        return { newPDFs: [], totalProcessed: 0 }
      }
    } catch (error) {
      job.log(`Error: ${error.message}`)
      await job.sendMessage(`❌ Ett fel uppstod vid sökning: ${error.message}`)
      throw error
    }
  }
)

// Function to test the Google search functionality
export async function testGoogleSearch(query = "hållbarhetsrapport 2024 type:pdf"): Promise<string[]> {
  try {
    const results = await searchGoogleForPDFs(query);
    const pdfLinks = results
      .filter(result => {
        return result.link.toLowerCase().endsWith('.pdf') || 
               result.mime === 'application/pdf' ||
               result.fileFormat === 'PDF/Adobe Acrobat'
      })
      .map(result => result.link);
    
    return pdfLinks;
  } catch (error) {
    console.error('Error testing Google search:', error);
    throw error;
  }
}

export default googleSearchPDFs
