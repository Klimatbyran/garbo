import { z } from "zod"
import type { TestSuite } from "../../promptTestingFramework/types"
import { newSchemaWithInstructionsArrayOfExplanations, oldSchema, recencyPrompt, schemaRecency } from "./testData"
import { expectedResults } from "./expected-results"
import { 
  prompt,
  } from "../prompt"
import { schema } from "../schema"

export const testSuite: TestSuite = {
  expectedResults,
  testVariations: [
    {
      name: "recency improvements",
      prompt: recencyPrompt,
      schema: schemaRecency,
    },
    {
      name: "current",
      prompt: prompt,
      schema: schema,
    }
  ]
} 
