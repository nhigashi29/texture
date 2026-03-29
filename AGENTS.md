# Texture

pnpm monorepo with three packages: `core`, `runner`, `cli`.

## Commands

- `pnpm install` — install dependencies
- `pnpm vitest run` — run tests
- `pnpm vitest run <file>` — run a specific test file
- `pnpm biome check --write .` — format and lint
- `pnpm add -F @texture/<pkg> <dep>` — add dependency to a specific package
- `pnpm add -Dw <dep>` — add dev dependency to workspace root

## Structure

```
packages/
  core/    — @texture/core
  runner/  — @texture/runner (depends on core)
  cli/     — @texture/cli (depends on core, runner)
```

## Linting / Formatting

- Biome for linting and formatting
- Run `pnpm biome check --write .` before committing

## Type checking

- No `tsc` build step — packages reference source `.ts` files directly via `main: "src/index.ts"`
- Types are data types (plain type aliases), not classes
