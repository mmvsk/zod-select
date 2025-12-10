# zod-select

Deep schema selection for Zod schemas using dot-notation paths.

## Development

Uses Bun for all tooling:

```sh
bun install      # Install dependencies
bun test         # Run tests
bun run typecheck # Type check with tsgo
```

## Structure

- `src/index.ts` - Public exports
- `src/select.ts` - Core selection logic and types
- `src/traversable.ts` - Zod type guards
- `tests/` - Bun test suite
