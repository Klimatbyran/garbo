# Prompt Testing Framework

Tools for running LLM prompt comparison tests across suites and analyzing the results.

## Components

- `run-suite.ts`: CLI entry to run a suite (loads suite config, files, runs comparisons)
- `comparison-test.ts`: Core comparison engine and summary printing
- `utils.ts`: Shared helpers (I/O, loading test files, etc.)
- `types.ts`: Shared TypeScript types
- `cli.ts`: Centralized CLI arg parsing for `run-suite.ts`
- `analyze-results.js`: Result inspection/analysis CLI

## Running a suite

Using npm scripts:

```bash
npm run test:scope12 -- [options]
```

Example:

```bash
npm run test:scope12 -- --years 2024 --files rise,catena --runs 3
```

Available options:

- `--years 2023,2024`: restrict accuracy checks to those years
- `--files rise,catena`: run only these input files (names without extension)
- `--runs 3`: number of runs per prompt/file (default 1)

## Environment variables

- The test runners will use **OPENAI_API_KEY** from your terminal session if it is set.
- If no terminal key is found, they fall back to the key configured in the Garbo environment.
- To use the Garbo key, ensure you do not override it with a terminal key.

Quick checks:

- Verify: `echo $OPENAI_API_KEY`
- Temporarily remove for the current shell: `unset OPENAI_API_KEY`

## Analyzing results

List available prompt/schema combinations (“stacks”):

```bash
npm run analyze -- scope12 --list-hashes
```

Analyze a specific stack:

```bash
npm run analyze -- scope12 --prompt <hash> --schema <hash>
```

Show CLI help:

```bash
npm run analyze -- --help
```

## Adding a new test suite

1. Create a suite folder, e.g. `src/jobs/<suite>/tests/`
2. Add `test-suite.ts` exporting `testSuite: TestSuite` with:
   - `expectedResults`: a map of expected JSON per file (or mapped name)
   - `testVariations`: array of `{ name, prompt, schema, baseline? }`
3. Add input files under `src/jobs/<suite>/tests/input/` with names matching keys in `expectedResults`
4. Run the suite:

```bash
npm run test:scope12
```

### Minimal example: `test-suite.ts`

```ts
import type { TestSuite } from '../../promptTestingFramework/types'
import { someZodSchema } from './schema'
import { expectedResults } from './expected-results'
import { promptA, promptB } from '../prompt'

export const testSuite: TestSuite = {
  expectedResults,
  testVariations: [
    { name: 'v1', prompt: promptA, schema: someZodSchema, baseline: true },
    { name: 'v2', prompt: promptB, schema: someZodSchema },
  ],
}
```

## Output

- Results are written to `src/jobs/<suite>/tests/comparison_results/`
- `hashMappings.json` keeps a mapping of prompt/schema hashes for analysis

## Tips

- Limit runs with `--files` and `--years` when iterating
- Use small `--runs` first, increase when prompts stabilize
