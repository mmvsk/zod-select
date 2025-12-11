import { test, expect, describe } from "bun:test";
import { z } from "zod";

import {
	type ZodSchemaAt,
	selectZodSchemaAt,
} from "../src/old";

const ageSchema = z.number();
const nameSchema = z.string();
const heightSchema = z.union([
	z.object({ unit: z.literal("cm"), valueCm: z.number() }),
	z.object({ unit: z.literal("in"), valueIn: z.number() }),
]);

const schema = z.object({
	name: nameSchema,
	deep: z.object({ a: z.object({ b: z.object({ c: z.string() }) }) }),
	gender: z.enum(["male", "female"]),
	metrics: z.object({ age: ageSchema, height: heightSchema }),
	children: z.record(z.string(), ageSchema),
	infos: z.array(z.string()),
	tuple: z.tuple([z.string(), z.number(), z.boolean()]),
});

describe("ZodSchemaAt type", () => {
	test("type assignments compile correctly", () => {
		const t1: ZodSchemaAt<typeof schema, "name"> = z.string(); t1;
		const t2: ZodSchemaAt<typeof schema, "deep.a.b"> = z.object({ c: z.string() }); t2;
		const t3: ZodSchemaAt<typeof schema, "metrics.height.0"> = z.object({ unit: z.literal("cm"), valueCm: z.number() }); t3;
		const t4: ZodSchemaAt<typeof schema, "children.*"> = z.number(); t4;
		const t5: ZodSchemaAt<typeof schema, "infos.*"> = z.string(); t5;
		const t6: ZodSchemaAt<typeof schema, "infos"> = z.array(z.string()); t6;
		const t7: ZodSchemaAt<typeof schema, "tuple.2"> = z.boolean(); t7;
	});
});

describe("selectZodSchemaAt", () => {
	describe("name field", () => {
		test("parses valid string", () => {
			const result = (selectZodSchemaAt(schema, "name") as z.ZodTypeAny).parse("John Doe");
			expect(result).toBe("John Doe");
		});

		test("rejects number", () => {
			expect(() => (selectZodSchemaAt(schema, "name") as z.ZodTypeAny).parse(3)).toThrow();
		});
	});

	describe("deep nested paths", () => {
		test("deep.a parses valid object", () => {
			const result = (selectZodSchemaAt(schema, "deep.a") as z.ZodTypeAny).parse({ b: { c: "hello" } });
			expect(result).toEqual({ b: { c: "hello" } });
		});

		test("deep.a rejects string", () => {
			expect(() => (selectZodSchemaAt(schema, "deep.a") as z.ZodTypeAny).parse("hello")).toThrow();
		});

		test("deep.a.b.c parses valid string", () => {
			const result = (selectZodSchemaAt(schema, "deep.a.b.c") as z.ZodTypeAny).parse("hello");
			expect(result).toBe("hello");
		});

		test("deep.a.b.c rejects number", () => {
			expect(() => (selectZodSchemaAt(schema, "deep.a.b.c") as z.ZodTypeAny).parse(0)).toThrow();
		});
	});

	describe("enum field", () => {
		test("gender parses valid enum value", () => {
			const result = (selectZodSchemaAt(schema, "gender") as z.ZodTypeAny).parse("male");
			expect(result).toBe("male");
		});

		test("gender rejects invalid enum value", () => {
			expect(() => (selectZodSchemaAt(schema, "gender") as z.ZodTypeAny).parse("bouh")).toThrow();
		});
	});

	describe("metrics", () => {
		test("metrics.age parses valid number", () => {
			const result = (selectZodSchemaAt(schema, "metrics.age") as z.ZodTypeAny).parse(4);
			expect(result).toBe(4);
		});

		test("metrics.age rejects string", () => {
			expect(() => (selectZodSchemaAt(schema, "metrics.age") as z.ZodTypeAny).parse("youpee")).toThrow();
		});

		test("metrics.height parses valid union variant", () => {
			const result = (selectZodSchemaAt(schema, "metrics.height") as z.ZodTypeAny).parse({ unit: "cm", valueCm: 3 });
			expect(result).toEqual({ unit: "cm", valueCm: 3 });
		});

		test("metrics.height rejects mismatched union variant", () => {
			expect(() => (selectZodSchemaAt(schema, "metrics.height") as z.ZodTypeAny).parse({ unit: "cm", valueIn: 3 })).toThrow();
		});

		test("metrics.height.1.valueIn parses valid number", () => {
			const result = (selectZodSchemaAt(schema, "metrics.height.1.valueIn") as z.ZodTypeAny).parse(3);
			expect(result).toBe(3);
		});

		test("metrics.height.1.valueIn rejects string", () => {
			expect(() => (selectZodSchemaAt(schema, "metrics.height.1.valueIn") as z.ZodTypeAny).parse("zorro")).toThrow();
		});
	});

	describe("record field", () => {
		test("children parses valid record", () => {
			const result = (selectZodSchemaAt(schema, "children") as z.ZodTypeAny).parse({ A: 8, B: 13 });
			expect(result).toEqual({ A: 8, B: 13 });
		});

		test("children rejects non-object", () => {
			expect(() => (selectZodSchemaAt(schema, "children") as z.ZodTypeAny).parse(13)).toThrow();
		});

		test("children.* parses valid number", () => {
			const result = (selectZodSchemaAt(schema, "children.*") as z.ZodTypeAny).parse(13);
			expect(result).toBe(13);
		});

		test("children.* rejects string", () => {
			expect(() => (selectZodSchemaAt(schema, "children.*") as z.ZodTypeAny).parse("a")).toThrow();
		});
	});

	describe("array field", () => {
		test("infos parses valid array", () => {
			const result = (selectZodSchemaAt(schema, "infos") as z.ZodTypeAny).parse(["nice", "car"]);
			expect(result).toEqual(["nice", "car"]);
		});

		test("infos rejects non-array", () => {
			expect(() => (selectZodSchemaAt(schema, "infos") as z.ZodTypeAny).parse("nice")).toThrow();
		});

		test("infos.* parses valid string element", () => {
			const result = (selectZodSchemaAt(schema, "infos.*") as z.ZodTypeAny).parse("nice");
			expect(result).toBe("nice");
		});

		test("infos.* rejects array", () => {
			expect(() => (selectZodSchemaAt(schema, "infos.*") as z.ZodTypeAny).parse(["nice"])).toThrow();
		});
	});

	describe("tuple field", () => {
		test("tuple.0 parses valid string", () => {
			const result = (selectZodSchemaAt(schema, "tuple.0") as z.ZodTypeAny).parse("hello");
			expect(result).toBe("hello");
		});

		test("tuple.0 rejects number", () => {
			expect(() => (selectZodSchemaAt(schema, "tuple.0") as z.ZodTypeAny).parse(0)).toThrow();
		});

		test("tuple.1 parses valid number", () => {
			const result = (selectZodSchemaAt(schema, "tuple.1") as z.ZodTypeAny).parse(0);
			expect(result).toBe(0);
		});

		test("tuple.2 parses valid boolean", () => {
			const result = (selectZodSchemaAt(schema, "tuple.2") as z.ZodTypeAny).parse(true);
			expect(result).toBe(true);
		});

		test("tuple parses valid tuple", () => {
			const result = (selectZodSchemaAt(schema, "tuple") as z.ZodTypeAny).parse(["ok", 4, false]);
			expect(result).toEqual(["ok", 4, false]);
		});
	});
});
