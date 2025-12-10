# zod-select

Deep schema selection for Zod v4 schemas using dot-notation paths.

## Installation

```sh
bun add zod-select
```

## Usage

```ts
import { z } from "zod";
import { selectZodSchemaAt, type ZodSchemaAt, type ZodInferAt } from "zod-select";

const schema = z.object({
  user: z.object({
    name: z.string(),
    age: z.number(),
  }),
  tags: z.array(z.string()),
  status: z.union([
    z.object({ type: z.literal("active") }),
    z.object({ type: z.literal("inactive"), reason: z.string() }),
  ]),
});

// Runtime selection
const nameSchema = selectZodSchemaAt(schema, "user.name"); // ZodString
const tagsSchema = selectZodSchemaAt(schema, "tags.*");    // ZodString (element)
const unionSchema = selectZodSchemaAt(schema, "status.1"); // Second union variant

// Type-level selection
type NameSchema = ZodSchemaAt<typeof schema, "user.name">;  // z.ZodString
type Name = ZodInferAt<typeof schema, "user.name">;         // string
```

## Path Syntax

| Schema Type | Path Syntax | Example |
|-------------|-------------|---------|
| Object | `field` | `"user.name"` |
| Array | `*` | `"tags.*"` |
| Record | `*` | `"scores.*"` |
| Tuple | `0`, `1`, ... | `"tuple.0"` |
| Union | `0`, `1`, ... | `"status.1"` |

## Exports

- `selectZodSchemaAt(schema, path)` - Select a sub-schema at runtime
- `ZodSchemaAt<T, P>` - Get the schema type at a path
- `ZodInferAt<T, P>` - Get the inferred type at a path
- `ZodTraversablePath` - Path type alias

## License

MIT
