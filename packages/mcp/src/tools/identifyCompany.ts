import { z } from 'zod'
import {
  identifyCompany,
  searchCompanyOptions,
  WikidataResult,
} from '../lib/identifyCompany'

/**
 * MCP Tool: identify_company
 *
 * Identifies a company on Wikidata based on the company name.
 * This is useful for getting structured company information including
 * Wikidata ID, label, and description.
 *
 * Input: Company name
 * Output: Wikidata result with company information
 */
export const identifyCompanyTool = {
  name: 'identify_company',
  description: `Identify a company on Wikidata and get structured company information including Wikidata ID, label, and description. This tool searches Wikidata for the company and uses AI to select the best match, prioritizing companies with carbon footprint reporting and Swedish companies.`,
  inputSchema: z.object({
    companyName: z
      .string()
      .describe('The name of the company to identify on Wikidata'),
  }),
  outputSchema: z.object({
    wikidata: z.object({
      node: z.string().describe('Wikidata entity ID (e.g., Q123456)'),
      url: z.string().describe('URL to the Wikidata entity page'),
      logo: z.string().optional().describe('URL to company logo if available'),
      label: z.string().describe('Company name from Wikidata'),
      description: z
        .string()
        .optional()
        .describe('Company description from Wikidata'),
    }),
  }),
  handler: async (input: {
    companyName: string
  }): Promise<{ wikidata: WikidataResult }> => {
    try {
      const wikidata = await identifyCompany(input.companyName)
      return { wikidata }
    } catch (error) {
      throw new Error(`Failed to identify company: ${error.message}`)
    }
  },
}

/**
 * MCP Tool: search_company_options
 *
 * Searches for company options on Wikidata without making a selection.
 * This is useful when you want to show multiple potential matches to the user.
 *
 * Input: Company name
 * Output: Array of potential Wikidata matches
 */
export const searchCompanyOptionsTool = {
  name: 'search_company_options',
  description: `Search for company options on Wikidata and return all potential matches. This is useful when you want to show multiple potential matches to the user instead of automatically selecting one.`,
  inputSchema: z.object({
    companyName: z
      .string()
      .describe('The name of the company to search for on Wikidata'),
  }),
  outputSchema: z.object({
    options: z.array(
      z.object({
        id: z.string().describe('Wikidata entity ID'),
        label: z.string().describe('Company name'),
        description: z.string().describe('Company description'),
      }),
    ),
  }),
  handler: async (input: { companyName: string }) => {
    try {
      const options = await searchCompanyOptions(input.companyName)
      return { options }
    } catch (error) {
      throw new Error(`Failed to search company options: ${error.message}`)
    }
  },
}
