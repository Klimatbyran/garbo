# Scope12 tests

This folder contains the input files and suite configuration for the Scope12 comparison tests.

## How to run the test suite

Run the npm script:

```bash
npm run test:scope12 [options]
```

## Options
- `--years 2023,2024`: only compare those years in scope12 arrays
- `--files rise,catena`: only run on the named input files (without extension)
- `--runs 3`: number of LLM runs per prompt/file combination (default 1)

Example:
```bash
npm run test:scope12 -- --years 2024 --files rise,catena --runs 3
```

## Results
- JSON reports are written to: `src/jobs/scope12/tests/comparison_results/`
- A `hashMappings.json` is maintained there to map prompt/schema hashes to content.

## Inspecting results and “stacks” (prompt/schema)
List available prompt/schema combinations detected in results:
```bash
npm run analyze -- scope12 --list-hashes
```

Analyze a specific combo:
```bash
npm run analyze -- scope12 --prompt <hash> --schema <hash>
```

Show CLI help for the analyzer:
```bash
npm run analyze -- --help
```
