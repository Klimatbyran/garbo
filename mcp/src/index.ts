import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import {
  identifyCompanyTool,
  searchCompanyOptionsTool,
} from './tools/identifyCompany.js'

/**
 * MCP Server for Sustainability Report Processing
 *
 * This server provides tools for:
 * - Identifying companies on Wikidata
 * - Searching for company options on Wikidata
 * - (More tools to be added: PDF parsing, emissions extraction, etc.)
 */

// Create MCP server
const server = new Server(
  {
    name: '@garbo/sustainability-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
)

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: identifyCompanyTool.name,
        description: identifyCompanyTool.description,
        inputSchema: identifyCompanyTool.inputSchema,
      },
      {
        name: searchCompanyOptionsTool.name,
        description: searchCompanyOptionsTool.description,
        inputSchema: searchCompanyOptionsTool.inputSchema,
      },
    ],
  }
})

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case identifyCompanyTool.name:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await identifyCompanyTool.handler(args),
                null,
                2,
              ),
            },
          ],
        }

      case searchCompanyOptionsTool.name:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await searchCompanyOptionsTool.handler(args),
                null,
                2,
              ),
            },
          ],
        }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error?.message || 'Unknown error',
            tool: name,
          }),
        },
      ],
      isError: true,
    }
  }
})

/**
 * Start the MCP server
 *
 * The server communicates via stdio, which is the standard way for MCP servers.
 * To run this server:
 *
 * ```bash
 * npm run dev
 * ```
 *
 * Or to use it with an MCP client (like Claude Desktop), add this to your
 * MCP client configuration:
 *
 * ```json
 * {
 *   "mcpServers": {
 *     "sustainability": {
 *       "command": "node",
 *       "args": ["/path/to/mcp/dist/index.js"]
 *     }
 *   }
 * }
 * ```
 */
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Sustainability MCP server running on stdio')
}

main().catch((error) => {
  console.error('Fatal error in main():', error)
  process.exit(1)
})
