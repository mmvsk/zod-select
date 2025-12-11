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

```
src/
  index.ts    # Public exports (SelectZodSchemaAt, ZodSchemaAt, ZodOutputAt)
  select.ts   # Runtime selection function (SelectZodSchemaAt)
  types.ts    # Type-level path resolution (ZodSchemaAt, ZodOutputAt)
  guards.ts   # Zod v4 type guards (IsZodObject, IsZodArray, etc.)
tests/
  all.test.ts # Test suite
```

## API

### Runtime
- `SelectZodSchemaAt(schema, path)` - Select sub-schema at path

### Type-level
- `ZodSchemaAt<T, P>` - Schema type at path
- `ZodOutputAt<T, P>` - Inferred output type at path

## Path Syntax

- Object: `"prop"` or `"a.b.c"`
- Array/Record element: `"arr[]"` or `"record[]"`
- Tuple/Union index: `"tuple[0]"` or `"union[1]"`
- Combined: `"users[].address.city"`, `"status[0].data"`

## Supported Types

Container: ZodObject, ZodArray, ZodRecord, ZodTuple, ZodUnion

Wrappers (auto-unwrapped): ZodOptional, ZodNullable, ZodDefault, ZodReadonly, ZodLazy, ZodPipe
