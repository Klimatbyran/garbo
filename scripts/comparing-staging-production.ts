import 'dotenv/config';
import fetch from 'node-fetch';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';

// Define URLs from environment variables
const STAGING_API_URL = "http://localhost:3000/api";


const PRODUCTION_API_URL = process.env.PRODUCTION_API_URL;

// Parse the API tokens assuming they are in the environment variables
const API_TOKENS = process.env.API_TOKENS;
if (!API_TOKENS) {
  throw new Error('API_TOKENS environment variable is not defined');
}
const tokens = API_TOKENS.split(',').reduce((acc, token) => {
  const [name, value] = token.split(':');
  acc[name] = value;
  return acc;
}, {} as Record<string, string>);

// Function to fetch companies from a given API URL
async function fetchCompanies(baseURL: string) {
  const response = await fetch(`${baseURL}/companies`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${tokens['garbo']}`, // Use the appropriate token
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch data from ${baseURL}: ${response.statusText}`);
  }
  const data = await response.json();
  console.log(`Fetched data from ${baseURL}:`, data); // Log fetched data for inspection
  return data;
}

// Function to compare data between staging and production
function compareData(stagingData: any[], productionData: any[]) {
  const verifiedFields = ['emissions', 'economy', 'employees'];

  const results = productionData.map((prodCompany) => {
    const stageCompany = stagingData.find(
      (comp) => comp.wikidataId === prodCompany.wikidataId
    );

    if (!stageCompany) {
      console.warn(`Company ${prodCompany.name} not found in staging data.`);
      return {
        name: prodCompany.name,
        accuracy: 'Not Found',
        missingFields: verifiedFields,
        note: 'Exists in production but not in staging',
      };
    }

    const matchedFields = [];
    const mismatchedFields = [];

    verifiedFields.forEach((field) => {
      if (prodCompany[field] && stageCompany[field]) {
        if (JSON.stringify(prodCompany[field]) === JSON.stringify(stageCompany[field])) {
          matchedFields.push(field);
        } else {
          mismatchedFields.push(field);
        }
      } else {
        mismatchedFields.push(field);
      }
    });

    const accuracy = (matchedFields.length / verifiedFields.length) * 100;
    const note = accuracy === 100 ? 'Complete match' : 'Partial match';

    return {
      name: prodCompany.name,
      accuracy: `${accuracy}%`,
      matchedFields,
      mismatchedFields,
      note,
    };
  });

  outputResults(results);
}

// Function to output results to a file
async function outputResults(results: any[]) {
  const outputPath = resolve('output', 'accuracy-results.json');
  await writeFile(outputPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`✅ Accuracy results written to ${outputPath}.`);
}

// Main function for fetching, comparison, and output
async function main() {
  try {
    const stagingData = await fetchCompanies(STAGING_API_URL); 
    const productionData = await fetchCompanies(PRODUCTION_API_URL); 
    compareData(stagingData, productionData);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Execute the main function
main();

// node --import tsx  scripts/comparing-staging-production.ts generates the output file accuracy-results.json with the comparison results between staging and production data. The output file contains an array of objects, each representing a company and its comparison results. The accuracy field indicates the percentage of matched fields between staging and production data. The matchedFields and mismatchedFields arrays list the fields that match and do not match, respectively. The note field provides additional information about the comparison results. The output file is written to the output directory in the project folder.