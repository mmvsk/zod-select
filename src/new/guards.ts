import type {
	ZodArray,
	ZodDefault,
	ZodLazy,
	ZodNullable,
	ZodObject,
	ZodOptional,
	ZodPipe,
	ZodReadonly,
	ZodRecord,
	ZodTuple,
	ZodUnion,
} from "zod";

type AnyZodType = { _zod?: { def?: { type?: string } } };

export function isZodObject(schema: AnyZodType): schema is ZodObject<any> {
	return schema._zod?.def?.type === "object";
}

export function isZodArray(schema: AnyZodType): schema is ZodArray<any> {
	return schema._zod?.def?.type === "array";
}

export function isZodRecord(schema: AnyZodType): schema is ZodRecord<any, any> {
	return schema._zod?.def?.type === "record";
}

export function isZodTuple(schema: AnyZodType): schema is ZodTuple<any> {
	return schema._zod?.def?.type === "tuple";
}

export function isZodUnion(schema: AnyZodType): schema is ZodUnion<any> {
	return schema._zod?.def?.type === "union";
}

export function isZodOptional(schema: AnyZodType): schema is ZodOptional<any> {
	return schema._zod?.def?.type === "optional";
}

export function isZodNullable(schema: AnyZodType): schema is ZodNullable<any> {
	return schema._zod?.def?.type === "nullable";
}

export function isZodDefault(schema: AnyZodType): schema is ZodDefault<any> {
	return schema._zod?.def?.type === "default";
}

export function isZodReadonly(schema: AnyZodType): schema is ZodReadonly<any> {
	return schema._zod?.def?.type === "readonly";
}

export function isZodLazy(schema: AnyZodType): schema is ZodLazy<any> {
	return schema._zod?.def?.type === "lazy";
}

export function isZodPipe(schema: AnyZodType): schema is ZodPipe<any, any> {
	return schema._zod?.def?.type === "pipe";
}
