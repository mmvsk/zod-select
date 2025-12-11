# zod-select

Deep schema selection for Zod v4 schemas using bracket-notation paths.

## Development

Uses Bun for all tooling:

```sh
bun install       # Install dependencies
bun test          # Run tests
bun run typecheck # Type check with tsgo
```

## Structure

- `src/new/` - Current implementation
  - `index.ts` - Public exports
  - `select.ts` - Runtime selection function
  - `types.ts` - Type-level SchemaAt, InferAt
  - `guards.ts` - Zod type guards
- `src/old/` - Legacy implementation (deprecated)
- `tests/new.test.ts` - Test suite
