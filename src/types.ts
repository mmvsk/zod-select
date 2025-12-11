import type {
	ZodType,
	ZodArray,
	ZodObject,
	ZodRecord,
	ZodTuple,
	ZodUnion,
	ZodOptional,
	ZodNullable,
	ZodDefault,
	ZodReadonly,
	infer as Infer,
} from "zod";

/**
 * Parse a path string into segments.
 * "users[].name" → ["users", "[]", "name"]
 * "tuple[0]" → ["tuple", "[0]"]
 * "a.b.c" → ["a", "b", "c"]
 */
type ParsePath<P extends string> =
	P extends `${infer Head}[${infer Idx}]${infer Rest}`
		? Head extends ""
			? [`[${Idx}]`, ...ParsePath<TrimLeadingDot<Rest>>]
			: [Head, `[${Idx}]`, ...ParsePath<TrimLeadingDot<Rest>>]
		: P extends `${infer Head}.${infer Rest}`
			? [Head, ...ParsePath<Rest>]
			: P extends ""
				? []
				: [P];

type TrimLeadingDot<S extends string> = S extends `.${infer Rest}` ? Rest : S;

/**
 * Extract numeric index from bracket notation.
 * "[0]" → 0
 * "[42]" → 42
 * "[]" → never
 */
type ExtractIndex<S extends string> =
	S extends `[${infer N}]`
		? N extends `${infer Num extends number}`
			? Num
			: never
		: never;

/**
 * Check if a segment is an element accessor (empty brackets).
 */
type IsElementAccessor<S extends string> = S extends "[]" ? true : false;

/**
 * Check if a segment is an index accessor (brackets with number).
 */
type IsIndexAccessor<S extends string> =
	S extends `[${infer N}]`
		? N extends ""
			? false
			: N extends `${number}`
				? true
				: false
		: false;

/**
 * Resolve a single path segment against a schema type.
 */
type ResolveSegment<T, Segment extends string> =
	// Object property access
	T extends ZodObject<infer Shape>
		? Segment extends keyof Shape
			? Shape[Segment]
			: never
		// Array element access with []
		: T extends ZodArray<infer Element>
			? IsElementAccessor<Segment> extends true
				? Element
				: never
			// Record value access with []
			: T extends ZodRecord<any, infer Value>
				? IsElementAccessor<Segment> extends true
					? Value
					: never
				// Tuple index access with [n]
				: T extends ZodTuple<infer Items>
					? IsIndexAccessor<Segment> extends true
						? ExtractIndex<Segment> extends keyof Items
							? Items[ExtractIndex<Segment>]
							: never
						: never
					// Union variant access with [n]
					: T extends ZodUnion<infer Options>
						? IsIndexAccessor<Segment> extends true
							? ExtractIndex<Segment> extends keyof Options
								? Options[ExtractIndex<Segment>]
								: never
							: never
						// Wrapper types - recurse into inner type
						: T extends ZodOptional<infer Inner>
							? ResolveSegment<Inner, Segment>
							: T extends ZodNullable<infer Inner>
								? ResolveSegment<Inner, Segment>
								: T extends ZodDefault<infer Inner>
									? ResolveSegment<Inner, Segment>
									: T extends ZodReadonly<infer Inner>
										? ResolveSegment<Inner, Segment>
										: never;

/**
 * Recursively resolve a path (as array of segments) against a schema type.
 */
type ResolvePath<T, Segments extends readonly string[]> =
	Segments extends [infer First extends string, ...infer Rest extends string[]]
		? ResolvePath<ResolveSegment<T, First>, Rest>
		: T;

/**
 * Get the schema type at a given path.
 *
 * @example
 * ```ts
 * const schema = z.object({ users: z.array(z.object({ name: z.string() })) })
 * type T = ZodSchemaAt<typeof schema, "users[].name"> // ZodString
 * ```
 */
export type ZodSchemaAt<T extends ZodType, P extends string> = ResolvePath<T, ParsePath<P>>;

/**
 * Infer the value type at a given path.
 *
 * @example
 * ```ts
 * const schema = z.object({ users: z.array(z.object({ name: z.string() })) })
 * type T = ZodOutputAt<typeof schema, "users[].name"> // string
 * ```
 */
export type ZodOutputAt<T extends ZodType, P extends string> = Infer<ZodSchemaAt<T, P>>;
