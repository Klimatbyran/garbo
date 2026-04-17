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

## Environment variables

- The tests will use **OPENAI_API_KEY** from your terminal session if it is set.
- If no terminal key is found, they fall back to the key configured in the Garbo environment.
- To use the Garbo key, ensure you do not override it with a terminal key.

Quick checks:

- Verify: `echo $OPENAI_API_KEY`
- Temporarily remove for the current shell: `unset OPENAI_API_KEY`

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

Companie's issues.

Scope 1&2 stated together:
Garo
Swedavia
Bergman & beving
