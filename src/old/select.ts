import {
	ZodType,
	ZodTuple,
	ZodUnion,
	ZodArray,
	ZodRecord,
	ZodObject,
	type infer as Infer,
} from "zod";

import {
	isZodTuple,
	isZodUnion,
	isZodArray,
	isZodRecord,
	isZodObject
} from "./traversable";


// SomeType is the internal base type that all Zod schemas extend
type AnyZodType = ZodType | { _zod: { def: { type: string } } };

type ArrayIndex = "*" | null;
type TupleIndex = number | `${number}`;
type Split<T extends string, S extends string = "."> =
	T extends `${infer A}${S}${infer B}`
		? [A, ...Split<B, S>]
		: [T];


type Segment = string | number | null; // ArrayIndex | TupleIndex | NonNumericString
export type Path = readonly [Segment, ...Segment[]];


export type InferAt<
	T extends AnyZodType,
	P extends Path | string,
	S extends string = "."
> = Infer<SchemaAt<T, P, S>>;


export type SchemaAt<
	T extends AnyZodType,
	P extends Path | string,
	S extends string = "."
> =
	P extends string
		? SelectSchemaAt<T, Split<P, S>>
		: SelectSchemaAt<T, Exclude<P, string>>;


type SelectSchemaAt<
	T extends AnyZodType,
	P extends Path
> =
	P extends [infer S, ...infer R]

		? T extends ZodTuple<infer Items>
			? S extends TupleIndex
				? S extends keyof Items ? (R extends Path ? SelectSchemaAt<Items[S], R> : Items[S]) : never
				: never

			: T extends ZodUnion<infer Options>
				? S extends TupleIndex
					? S extends keyof Options ? (R extends Path ? SelectSchemaAt<Options[S], R> : Options[S]) : never
					: never

				: T extends ZodArray<infer Element>
					? S extends ArrayIndex
						? (R extends Path ? SelectSchemaAt<Element, R> : Element)
						: never

					: T extends ZodRecord<any, infer Value>
						? S extends ArrayIndex
							? (R extends Path ? SelectSchemaAt<Value, R> : Value)
							: never

						: T extends ZodObject<infer Shape>
							? S extends keyof Shape ? (R extends Path ? SelectSchemaAt<Shape[S], R> : Shape[S]) : never
							: never

		: never;


export function selectSchemaAt<
	T extends AnyZodType,
	P extends Path | string
>(schema: T, path: P): SchemaAt<T, P> {
	const arrayPath = (typeof path === "string" ? path.split(".") : path) as Path;
	const [segment, ...rest] = arrayPath;

	const select = (childSchema: AnyZodType): any =>
		rest.length ? selectSchemaAt(childSchema, rest as unknown as Path) : childSchema;

	if (isZodTuple(schema)) {
		if (!isTupleIndex(segment)) {
			throw new Error(`Invalid ZodTuple segment type: ${segment}`);
		}

		const items = schema._zod.def.items;
		if (typeof items[segment as number] === "undefined") {
			throw new Error(`Invalid ZodTuple index: ${segment}`);
		}

		return select(items[segment as number]);
	}

	if (isZodUnion(schema)) {
		if (!isTupleIndex(segment)) {
			throw new Error(`Invalid ZodUnion segment type: ${segment}`);
		}

		if (typeof schema.options[segment as number] === "undefined") {
			throw new Error(`Invalid ZodUnion index: ${segment}`);
		}

		return select(schema.options[segment as number]);
	}

	if (isZodArray(schema)) {
		if (!isArrayIndex(segment)) {
			throw new Error(`Invalid ZodArray segment type: ${segment}`);
		}

		return select(schema.element);
	}

	if (isZodRecord(schema)) {
		if (!isArrayIndex(segment)) {
			throw new Error(`Invalid ZodRecord segment type: ${segment}`);
		}

		return select(schema.valueType);
	}

	if (isZodObject(schema)) {
		if (!isObjectIndex(segment)) {
			throw new Error(`Invalid ZodObject segment type: ${segment}`);
		}

		if (typeof schema.shape[segment] === "undefined") {
			throw new Error(`Invalid ZodObject index: ${segment}`);
		}

		return select(schema.shape[segment]);
	}

	throw new Error(`Can't traverse the given schema`);
}


function isTupleIndex(segment: Segment): segment is number | string {
	if (typeof segment === "string") {
		return parseInt(segment).toString() === segment;
	}

	if (typeof segment === "number") {
		return Number.isSafeInteger(segment);
	}

	return false;
}


function isArrayIndex(segment: Segment): segment is "*" | null {
	return segment === "*" || segment === null;
}


function isObjectIndex(segment: Segment): segment is number | string {
	return typeof segment === "string" || typeof segment === "number";
}
