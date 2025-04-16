import { testGoogleSearch } from '../workers/googleSearchPDFs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log('Testing Google search for PDFs...');
    const query = process.argv[2] || 'hållbarhetsrapport 2024 filetype:pdf';
    console.log(`Using query: ${query}`);
    
    const pdfLinks = await testGoogleSearch(query);
    
    console.log(`Found ${pdfLinks.length} PDF links:`);
    pdfLinks.forEach((link, index) => {
      console.log(`${index + 1}. ${link}`);
    });
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
