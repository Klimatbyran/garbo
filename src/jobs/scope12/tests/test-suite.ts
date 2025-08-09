import { z } from "zod"

// Import the TestSuite type from the framework
import type { TestSuite } from "../../promptTestingFramework/generic-run-comparison"

// Import from existing files
import { newSchemaWithInstructions } from "./testData"
import { expectedResults } from "./expected-results"
import { 
  lantmannenTestBalancedUnknownMb 
} from "../prompt"

// Export the complete TestSuite object
export const testSuite: TestSuite = {
  expectedResults,
  testVariations: [
    {
      name: "example with balanced unknown mb",
      prompt: lantmannenTestBalancedUnknownMb,
      schema: newSchemaWithInstructions,
    }
  ]
} 