import {
	ZodTuple,
	ZodUnion,
	ZodArray,
	ZodRecord,
	ZodObject,
} from "zod";

type AnyZodType = { _zod?: { def?: { type?: string } } };

export function isZodTuple(schema: AnyZodType): schema is ZodTuple<any> {
	return schema._zod?.def?.type === "tuple";
}

export function isZodUnion(schema: AnyZodType): schema is ZodUnion<any> {
	return schema._zod?.def?.type === "union";
}

export function isZodArray(schema: AnyZodType): schema is ZodArray<any> {
	return schema._zod?.def?.type === "array";
}

export function isZodRecord(schema: AnyZodType): schema is ZodRecord<any, any> {
	return schema._zod?.def?.type === "record";
}

export function isZodObject(schema: AnyZodType): schema is ZodObject<any> {
	return schema._zod?.def?.type === "object";
}
