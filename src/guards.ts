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


export function IsZodObject(schema: AnyZodType): schema is ZodObject<any> {
	return schema._zod?.def?.type === "object";
}

export function IsZodArray(schema: AnyZodType): schema is ZodArray<any> {
	return schema._zod?.def?.type === "array";
}

export function IsZodRecord(schema: AnyZodType): schema is ZodRecord<any, any> {
	return schema._zod?.def?.type === "record";
}

export function IsZodTuple(schema: AnyZodType): schema is ZodTuple<any> {
	return schema._zod?.def?.type === "tuple";
}

export function IsZodUnion(schema: AnyZodType): schema is ZodUnion<any> {
	return schema._zod?.def?.type === "union";
}

export function IsZodOptional(schema: AnyZodType): schema is ZodOptional<any> {
	return schema._zod?.def?.type === "optional";
}

export function IsZodNullable(schema: AnyZodType): schema is ZodNullable<any> {
	return schema._zod?.def?.type === "nullable";
}

export function IsZodDefault(schema: AnyZodType): schema is ZodDefault<any> {
	return schema._zod?.def?.type === "default";
}

export function IsZodReadonly(schema: AnyZodType): schema is ZodReadonly<any> {
	return schema._zod?.def?.type === "readonly";
}

export function IsZodLazy(schema: AnyZodType): schema is ZodLazy<any> {
	return schema._zod?.def?.type === "lazy";
}

export function IsZodPipe(schema: AnyZodType): schema is ZodPipe<any, any> {
	return schema._zod?.def?.type === "pipe";
}
