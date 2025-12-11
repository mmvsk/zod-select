# zod-select

Deep schema selection for Zod v4 schemas using bracket-notation paths.

Select nested sub-schemas from complex Zod types at both runtime and type-level, with full support for wrapper types.

## Installation

```sh
bun add zod-select
# or
npm install zod-select
```

## Usage

```ts
import { z } from "zod";
import { SelectZodSchemaAt, type ZodSchemaAt, type ZodOutputAt } from "zod-select";

const schema = z.object({
  users: z.array(z.object({
    name: z.string(),
    email: z.string().optional(),
    address: z.object({
      city: z.string(),
      zip: z.number(),
    }),
  })),
  config: z.record(z.string(), z.boolean()),
  status: z.union([
    z.object({ type: z.literal("ok"), data: z.string() }),
    z.object({ type: z.literal("error"), message: z.string() }),
  ]),
  coords: z.tuple([z.number(), z.number(), z.string()]),
});

// Runtime selection - returns the actual Zod schema
const nameSchema = SelectZodSchemaAt(schema, "users[].name");        // ZodString
const citySchema = SelectZodSchemaAt(schema, "users[].address.city"); // ZodString
const configVal = SelectZodSchemaAt(schema, "config[]");             // ZodBoolean
const okVariant = SelectZodSchemaAt(schema, "status[0]");            // ZodObject<{ type, data }>
const firstCoord = SelectZodSchemaAt(schema, "coords[0]");           // ZodNumber

// Use selected schemas for validation
nameSchema.parse("John");  // "John"
nameSchema.parse(123);     // throws ZodError

// Type-level schema extraction
type NameSchema = ZodSchemaAt<typeof schema, "users[].name">;        // ZodString
type StatusSchema = ZodSchemaAt<typeof schema, "status[0].data">;    // ZodString

// Type-level output inference
type UserName = ZodOutputAt<typeof schema, "users[].name">;          // string
type UserEmail = ZodOutputAt<typeof schema, "users[].email">;        // string | undefined
type Coord = ZodOutputAt<typeof schema, "coords[0]">;                // number
type ErrorMsg = ZodOutputAt<typeof schema, "status[1].message">;     // string
```

## Path Syntax

| Schema Type     | Syntax   | Example            | Description                     |
|-----------------|----------|--------------------|---------------------------------|
| Object property | `.field` | `"user.name"`      | Access object property          |
| Array element   | `[]`     | `"users[]"`        | Access array element schema     |
| Record value    | `[]`     | `"config[]"`       | Access record value schema      |
| Tuple index     | `[n]`    | `"coords[0]"`      | Access tuple element by index   |
| Union variant   | `[n]`    | `"status[1]"`      | Access union option by index    |

Paths can be combined for deep access:
- `"users[].address.city"` - array element's nested property
- `"status[0].data"` - union variant's property
- `"matrix[][]"` - nested array element (array of arrays)

## Exports

### Runtime

- **`SelectZodSchemaAt(schema, path)`** - Select a sub-schema at the given path. Returns the actual Zod schema that can be used for validation.

### Type-level

- **`ZodSchemaAt<T, P>`** - Extract the Zod schema type at path `P` within schema `T`
- **`ZodOutputAt<T, P>`** - Infer the output type (what `.parse()` returns) at path `P`

## Supported Schema Types

### Container Types
- `ZodObject` - property access via `.field`
- `ZodArray` - element access via `[]`
- `ZodRecord` - value access via `[]`
- `ZodTuple` - index access via `[n]`
- `ZodUnion` - variant access via `[n]`

### Wrapper Types (automatically unwrapped during traversal)
- `ZodOptional` - `.optional()`
- `ZodNullable` - `.nullable()`
- `ZodDefault` - `.default(value)`
- `ZodReadonly` - `.readonly()`
- `ZodLazy` - `z.lazy()`
- `ZodPipe` - `.pipe()` (traverses into output schema)

Wrapper types are unwrapped during path traversal but preserved in the result:

```ts
const schema = z.object({
  name: z.string().optional(),
  count: z.number().default(0),
});

const nameSchema = SelectZodSchemaAt(schema, "name");
// Returns ZodOptional<ZodString> - wrapper preserved

type Name = ZodOutputAt<typeof schema, "name">;
// string | undefined - optional reflected in output type

const countSchema = SelectZodSchemaAt(schema, "count");
// Returns ZodDefault<ZodNumber> - wrapper preserved

countSchema.parse(undefined);  // 0 (default applied)
```

## Error Handling

`SelectZodSchemaAt` throws descriptive errors for invalid paths:

```ts
SelectZodSchemaAt(schema, "nonexistent");
// Error: Invalid path "nonexistent": property "nonexistent" does not exist on object schema

SelectZodSchemaAt(schema, "users[].invalid");
// Error: Invalid path "users[].invalid": property "invalid" does not exist on object schema

SelectZodSchemaAt(schema, "name[]");
// Error: Invalid path "name[]": cannot use [] on non-array/record schema (got string)

SelectZodSchemaAt(schema, "coords[10]");
// Error: Invalid path "coords[10]": tuple index 10 out of bounds (length 3)
```

## Requirements

- Zod v4 (uses Zod v4's internal `_zod` structure)
- TypeScript 5.0+ (for template literal type inference)

## License

MIT
