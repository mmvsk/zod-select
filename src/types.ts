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
 * Get the schema type at a given path.
 *
 * @example
 * ```ts
 * const schema = z.object({ users: z.array(z.object({ name: z.string() })) })
 * type NameTs = ZodSchemaAt<typeof schema, "users[].name"> // ZodString
 * ```
 */
export type ZodSchemaAt<TZodType extends ZodType, TPath extends string> = (
	ResolvePath<TZodType, ParsePath<TPath>>
);


/**
 * Infer the value type at a given path.
 *
 * @example
 * ```ts
 * const schema = z.object({ users: z.array(z.object({ name: z.string() })) })
 * type Name = ZodOutputAt<typeof schema, "users[].name"> // string
 * ```
 */
export type ZodOutputAt<TZodType extends ZodType, TPath extends string> = (
	Infer<ZodSchemaAt<TZodType, TPath>>
);


/**
 * Parse a path string into segments.
 * "users[].name" → ["users", "[]", "name"]
 * "tuple[0]" → ["tuple", "[0]"]
 * "a.b.c" → ["a", "b", "c"]
 */
type ParsePath<TPath extends string> = (
	TPath extends `${infer Head}[${infer Idx}]${infer Rest}`
		? Head extends ""
			? [`[${Idx}]`, ...ParsePath<TrimLeadingDot<Rest>>]
			: [Head, `[${Idx}]`, ...ParsePath<TrimLeadingDot<Rest>>]
		: TPath extends `${infer Head}.${infer Rest}`
			? [Head, ...ParsePath<Rest>]
			: TPath extends ""
				? []
				: [TPath]
);


type TrimLeadingDot<TSegment extends string> = (
	TSegment extends `.${infer Rest}` ? Rest : TSegment
);


/**
 * Extract numeric index from bracket notation.
 * "[0]" → 0
 * "[42]" → 42
 * "[]" → never
 */
type ExtractIndex<TSegment extends string> = (
	TSegment extends `[${infer N}]`
		? N extends `${infer Num extends number}`
			? Num
			: never
		: never
);


/**
 * Check if a segment is an element accessor (empty brackets).
 */
type IsElementAccessor<TSegment extends string> = (
	TSegment extends "[]" ? true : false
);


/**
 * Check if a segment is an index accessor (brackets with number).
 */
type IsIndexAccessor<TSegment extends string> = (
	TSegment extends `[${infer N}]`
		? N extends ""
			? false
			: N extends `${number}`
				? true
				: false
		: false
);


/**
 * Recursively resolve a path (as array of segments) against a schema type.
 */
type ResolvePath<TZodType, TSegmentList extends readonly string[]> = (
	TSegmentList extends [infer First extends string, ...infer Rest extends string[]]
		? ResolvePath<ResolveSegment<TZodType, First>, Rest>
		: TZodType
);


/**
 * Resolve a single path segment against a schema type.
 */
type ResolveSegment<TZodType, TSegment extends string> = (
	// Object property access
	TZodType extends ZodObject<infer Shape>
		? TSegment extends keyof Shape
			? Shape[TSegment]
			: never
		// Array element access with []
		: TZodType extends ZodArray<infer Element>
			? IsElementAccessor<TSegment> extends true
				? Element
				: never
			// Record value access with []
			: TZodType extends ZodRecord<any, infer Value>
				? IsElementAccessor<TSegment> extends true
					? Value
					: never
				// Tuple index access with [n]
				: TZodType extends ZodTuple<infer Items>
					? IsIndexAccessor<TSegment> extends true
						? ExtractIndex<TSegment> extends keyof Items
							? Items[ExtractIndex<TSegment>]
							: never
						: never
					// Union variant access with [n]
					: TZodType extends ZodUnion<infer Options>
						? IsIndexAccessor<TSegment> extends true
							? ExtractIndex<TSegment> extends keyof Options
								? Options[ExtractIndex<TSegment>]
								: never
							: never
						// Wrapper types - recurse into inner type
						: TZodType extends ZodOptional<infer Inner>
							? ResolveSegment<Inner, TSegment>
							: TZodType extends ZodNullable<infer Inner>
								? ResolveSegment<Inner, TSegment>
								: TZodType extends ZodDefault<infer Inner>
									? ResolveSegment<Inner, TSegment>
									: TZodType extends ZodReadonly<infer Inner>
										? ResolveSegment<Inner, TSegment>
										: never
);
