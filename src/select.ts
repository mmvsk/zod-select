import type { ZodType } from "zod";
import type { ZodSchemaAt } from "./types";
import {
	IsZodObject,
	IsZodArray,
	IsZodRecord,
	IsZodTuple,
	IsZodUnion,
	IsZodOptional,
	IsZodNullable,
	IsZodDefault,
	IsZodReadonly,
	IsZodLazy,
	IsZodPipe,
} from "./guards";

type Segment =
	| { type: "property"; name: string }
	| { type: "element" }
	| { type: "index"; index: number };

/**
 * Parse a path string into segments.
 *
 * @example
 * ParsePath("users[].name") // [{ type: "property", name: "users" }, { type: "element" }, { type: "property", name: "name" }]
 * ParsePath("tuple[0]") // [{ type: "property", name: "tuple" }, { type: "index", index: 0 }]
 */
function ParsePath(path: string): Segment[] {
	const segments: Segment[] = [];
	let i = 0;

	while (i < path.length) {
		// Skip leading dot
		if (path[i] === ".") {
			i++;
			continue;
		}

		// Bracket notation
		if (path[i] === "[") {
			const closeBracket = path.indexOf("]", i);
			if (closeBracket === -1) {
				throw new Error(`Invalid path: unclosed bracket at position ${i}`);
			}

			const content = path.slice(i + 1, closeBracket);

			if (content === "") {
				segments.push({ type: "element" });
			} else {
				const index = parseInt(content, 10);
				if (isNaN(index) || index < 0) {
					throw new Error(`Invalid path: invalid index "${content}" at position ${i}`);
				}
				segments.push({ type: "index", index });
			}

			i = closeBracket + 1;
			continue;
		}

		// Property name
		const nextDot = path.indexOf(".", i);
		const nextBracket = path.indexOf("[", i);

		let end: number;
		if (nextDot === -1 && nextBracket === -1) {
			end = path.length;
		} else if (nextDot === -1) {
			end = nextBracket;
		} else if (nextBracket === -1) {
			end = nextDot;
		} else {
			end = Math.min(nextDot, nextBracket);
		}

		const name = path.slice(i, end);
		if (name === "") {
			throw new Error(`Invalid path: empty property name at position ${i}`);
		}

		segments.push({ type: "property", name });
		i = end;
	}

	return segments;
}

/**
 * Traverse a schema following a single segment.
 */
function TraverseSegment(schema: ZodType, segment: Segment, fullPath: string): ZodType {
	// Unwrap wrapper types first (optional, nullable, default, readonly, lazy, pipe)
	if (IsZodOptional(schema)) {
		return TraverseSegment(schema._zod.def.innerType, segment, fullPath);
	}
	if (IsZodNullable(schema)) {
		return TraverseSegment(schema._zod.def.innerType, segment, fullPath);
	}
	if (IsZodDefault(schema)) {
		return TraverseSegment(schema._zod.def.innerType, segment, fullPath);
	}
	if (IsZodReadonly(schema)) {
		return TraverseSegment(schema._zod.def.innerType, segment, fullPath);
	}
	if (IsZodLazy(schema)) {
		return TraverseSegment(schema._zod.innerType, segment, fullPath);
	}
	if (IsZodPipe(schema)) {
		// For pipe, traverse into the output schema
		return TraverseSegment(schema._zod.def.out, segment, fullPath);
	}

	// Handle segment types
	switch (segment.type) {
		case "property": {
			if (!IsZodObject(schema)) {
				throw new Error(
					`Invalid path "${fullPath}": cannot access property "${segment.name}" on non-object schema (got ${schema._zod.def.type})`
				);
			}
			const shape = schema._zod.def.shape;
			if (!(segment.name in shape)) {
				throw new Error(
					`Invalid path "${fullPath}": property "${segment.name}" does not exist on object schema`
				);
			}
			return shape[segment.name];
		}

		case "element": {
			if (IsZodArray(schema)) {
				return schema._zod.def.element;
			}
			if (IsZodRecord(schema)) {
				return schema._zod.def.valueType;
			}
			throw new Error(
				`Invalid path "${fullPath}": cannot use [] on non-array/record schema (got ${schema._zod.def.type})`
			);
		}

		case "index": {
			if (IsZodTuple(schema)) {
				const items = schema._zod.def.items;
				if (segment.index >= items.length) {
					throw new Error(
						`Invalid path "${fullPath}": tuple index ${segment.index} out of bounds (length ${items.length})`
					);
				}
				return items[segment.index];
			}
			if (IsZodUnion(schema)) {
				const options = schema._zod.def.options;
				if (segment.index >= options.length) {
					throw new Error(
						`Invalid path "${fullPath}": union index ${segment.index} out of bounds (${options.length} options)`
					);
				}
				return options[segment.index];
			}
			throw new Error(
				`Invalid path "${fullPath}": cannot use [${segment.index}] on non-tuple/union schema (got ${schema._zod.def.type})`
			);
		}
	}
}

/**
 * Select a nested schema at the given path.
 *
 * @example
 * ```ts
 * const schema = z.object({ users: z.array(z.object({ name: z.string() })) })
 * const nameSchema = SelectZodSchemaAt(schema, "users[].name") // ZodString
 * ```
 */
export function SelectZodSchemaAt<T extends ZodType, P extends string>(
	schema: T,
	path: P
): ZodSchemaAt<T, P> {
	if (path === "") {
		return schema as ZodSchemaAt<T, P>;
	}

	const segments = ParsePath(path);
	let current: ZodType = schema;

	for (const segment of segments) {
		current = TraverseSegment(current, segment, path);
	}

	return current as ZodSchemaAt<T, P>;
}
