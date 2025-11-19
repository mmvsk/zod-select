import {
	ZodType,
	ZodTypeDef,
	ZodTuple,
	ZodUnion,
	ZodArray,
	ZodRecord,
	AnyZodObject,
	infer as Infer,
} from "zod";

import {
	isZodTuple,
	isZodUnion,
	isZodArrayOrRecord,
	isZodObject
} from "./traversable";


type AnyZodType = ZodType<any, ZodTypeDef, any>;

type ArrayIndex = "*" | null;
type TupleIndex = number | `${number}`;
type Segment = string | number | null; // ArrayIndex | TupleIndex | NonNumericString
type Split<T extends string, S extends string = "."> =
	T extends `${infer A}${S}${infer B}`
		? [A, ...Split<B, S>]
		: [T];


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

		? T extends ZodTuple<any>
			? S extends TupleIndex
				? S extends keyof T["items"] ? (R extends Path ? SelectSchemaAt<T["items"][S], R> : T["items"][S]) : never
				: never

			: T extends ZodUnion<any>
				? S extends TupleIndex
					? S extends keyof T["options"] ? (R extends Path ? SelectSchemaAt<T["options"][S], R> : T["options"][S]) : never
					: never

				: T extends ZodArray<any> | ZodRecord<any>
					? S extends ArrayIndex
						? (R extends Path ? SelectSchemaAt<T["element"], R> : T["element"])
						: never

					: T extends AnyZodObject
						? S extends keyof T["shape"] ? (R extends Path ? SelectSchemaAt<T["shape"][S], R> : T["shape"][S]) : never
						: never

		: never;


export function selectSchemaAt<
	T extends AnyZodType,
	P extends Path | string
>(schema: T, path: P): SchemaAt<T, P> {
	const arrayPath = typeof path === "string" ? path.split(".") : path;
	const [segment, ...rest] = arrayPath;

	const select = (childSchema: AnyZodType): any =>
		rest.length ? selectSchemaAt(childSchema, rest as unknown as Path) : childSchema;

	if (isZodTuple(schema)) {
		if (!isTupleIndex(segment)) {
			throw new Error(`Invalid ZodTuple segment type: ${segment}`);
		}

		if (typeof schema.items[segment] === "undefined") {
			throw new Error(`Invalid ZodTuple index: ${segment}`);
		}

		return select(schema.items[segment]);
	}

	if (isZodUnion(schema)) {
		if (!isTupleIndex(segment)) {
			throw new Error(`Invalid ZodUnion segment type: ${segment}`);
		}

		if (typeof schema.options[segment] === "undefined") {
			throw new Error(`Invalid ZodUnion index: ${segment}`);
		}

		return select(schema.options[segment]);
	}

	if (isZodArrayOrRecord(schema)) {
		if (!isArrayIndex(segment)) {
			throw new Error(`Invalid ZodArray or ZodRecord segment type: ${segment}`);
		}

		return select(schema.element);
	}

	if (isZodObject(schema)) {
		if (!isObjectIndex(segment)) {
			throw new Error(`Invalid ZodObject segment type: ${segment}`);
		}

		if (typeof schema.shape[segment] === "undefined") {
			console.log(schema.shape, segment)
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
