# zod-select

Deep schema selection for Zod v4 schemas using bracket-notation paths.

## Installation

```sh
bun add zod-select
```

## Usage

```ts
import { z } from "zod";
import { select, type SchemaAt, type InferAt } from "zod-select";

const schema = z.object({
  users: z.array(z.object({
    name: z.string(),
    email: z.string().optional(),
  })),
  config: z.record(z.string(), z.boolean()),
  status: z.union([
    z.object({ type: z.literal("ok"), data: z.string() }),
    z.object({ type: z.literal("error"), message: z.string() }),
  ]),
  coords: z.tuple([z.number(), z.number()]),
});

// Runtime selection
const nameSchema = select(schema, "users[].name");     // ZodString
const configVal = select(schema, "config[]");          // ZodBoolean
const okVariant = select(schema, "status[0]");         // ZodObject<{ type, data }>
const firstCoord = select(schema, "coords[0]");        // ZodNumber

// Type-level inference
type UserName = InferAt<typeof schema, "users[].name">;  // string
type UserEmail = InferAt<typeof schema, "users[].email">; // string | undefined
type Coord = InferAt<typeof schema, "coords[0]">;        // number
```

## Path Syntax

| Schema Type | Syntax | Example |
|-------------|--------|---------|
| Object property | `.field` | `"user.name"` |
| Array element | `[]` | `"users[]"` |
| Record value | `[]` | `"config[]"` |
| Tuple index | `[n]` | `"coords[0]"` |
| Union variant | `[n]` | `"status[1]"` |

Paths can be combined: `"users[].address.city"`, `"status[0].data"`

## Exports

- `select(schema, path)` - Select a sub-schema at runtime
- `SchemaAt<T, P>` - Get the schema type at a path
- `InferAt<T, P>` - Get the inferred value type at a path

## Wrapper Types

Wrapper types (optional, nullable, default) are preserved:

```ts
const schema = z.object({ name: z.string().optional() });

select(schema, "name");                        // ZodOptional<ZodString>
type T = InferAt<typeof schema, "name">;       // string | undefined
```

## License

MIT
