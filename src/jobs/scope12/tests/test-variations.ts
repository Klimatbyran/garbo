import { oldSchema, newSchema, newSchemaWithInstructions } from "./data"
import { prompt as basePrompt, marketBasedShortVersionPrompt, byggmaxImprovements, lantmannenTest, lantmannenTestCombined, lantmannenTestUnkonwnStress, lantmannenTestBalancedUnknownMb  } from "../prompt"

// Test variations - edit this file to add/remove/modify test cases
export const testVariations = [
  {
    name: "example with balanced unknown mb",
    prompt: lantmannenTestBalancedUnknownMb,
    schema: newSchemaWithInstructions,
  },
 /* {
    name: "baseline prompt",
    prompt: basePrompt,
    schema: newSchema,
    baseline: true
  }*/
];