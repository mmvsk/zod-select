import { test, expect, describe } from "bun:test";
import { z } from "zod";

import { SelectZodSchemaAt, type ZodSchemaAt, type ZodOutputAt } from "../src";

// Test schema covering various types
const schema = z.object({
	name: z.string(),
	age: z.number(),
	deep: z.object({
		a: z.object({
			b: z.object({
				c: z.string(),
			}),
		}),
	}),
	users: z.array(
		z.object({
			name: z.string(),
			email: z.string().optional(),
			address: z.object({
				city: z.string(),
				zip: z.number(),
			}),
		})
	),
	config: z.record(z.string(), z.boolean()),
	status: z.union([
		z.object({ type: z.literal("ok"), data: z.string() }),
		z.object({ type: z.literal("error"), message: z.string() }),
	]),
	coords: z.tuple([z.number(), z.number(), z.string()]),
	optionalField: z.string().optional(),
	nullableField: z.string().nullable(),
	defaultField: z.string().default("default"),
});

describe("ZodSchemaAt type", () => {
	test("type assignments compile correctly", () => {
		// Object properties
		const t1: ZodSchemaAt<typeof schema, "name"> = z.string();
		t1;

		// Deep nesting
		const t2: ZodSchemaAt<typeof schema, "deep.a.b"> = z.object({ c: z.string() });
		t2;

		const t3: ZodSchemaAt<typeof schema, "deep.a.b.c"> = z.string();
		t3;

		// Array element
		const t4: ZodSchemaAt<typeof schema, "users[]"> = z.object({
			name: z.string(),
			email: z.string().optional(),
			address: z.object({ city: z.string(), zip: z.number() }),
		});
		t4;

		// Array element property
		const t5: ZodSchemaAt<typeof schema, "users[].name"> = z.string();
		t5;

		// Record value
		const t6: ZodSchemaAt<typeof schema, "config[]"> = z.boolean();
		t6;

		// Tuple index
		const t7: ZodSchemaAt<typeof schema, "coords[0]"> = z.number();
		t7;

		const t8: ZodSchemaAt<typeof schema, "coords[2]"> = z.string();
		t8;

		// Union variant
		const t9: ZodSchemaAt<typeof schema, "status[0]"> = z.object({
			type: z.literal("ok"),
			data: z.string(),
		});
		t9;

		const t10: ZodSchemaAt<typeof schema, "status[0].data"> = z.string();
		t10;

		// Optional field (preserved)
		const t11: ZodSchemaAt<typeof schema, "optionalField"> = z.string().optional();
		t11;
	});
});

describe("ZodOutputAt type", () => {
	test("type assignments compile correctly", () => {
		// Basic property
		const t1: ZodOutputAt<typeof schema, "name"> = "hello";
		t1;

		// Deep nesting
		const t2: ZodOutputAt<typeof schema, "deep.a.b.c"> = "hello";
		t2;

		// Array element property
		const t3: ZodOutputAt<typeof schema, "users[].name"> = "hello";
		t3;

		// Optional field includes undefined
		const t4: ZodOutputAt<typeof schema, "optionalField"> = undefined;
		const t5: ZodOutputAt<typeof schema, "optionalField"> = "hello";
		t4;
		t5;

		// Nullable field includes null
		const t6: ZodOutputAt<typeof schema, "nullableField"> = null;
		const t7: ZodOutputAt<typeof schema, "nullableField"> = "hello";
		t6;
		t7;

		// Tuple element
		const t8: ZodOutputAt<typeof schema, "coords[0]"> = 42;
		t8;

		// Union variant property
		const t9: ZodOutputAt<typeof schema, "status[0].data"> = "hello";
		t9;
	});
});

describe("SelectZodSchemaAt runtime", () => {
	describe("object property selection", () => {
		test("selects top-level property", () => {
			const result = SelectZodSchemaAt(schema, "name");
			expect(result.parse("John")).toBe("John");
			expect(() => result.parse(123)).toThrow();
		});

		test("selects nested property", () => {
			const result = SelectZodSchemaAt(schema, "deep.a.b.c");
			expect(result.parse("hello")).toBe("hello");
			expect(() => result.parse(123)).toThrow();
		});

		test("throws on invalid property", () => {
			expect(() => SelectZodSchemaAt(schema, "nonexistent")).toThrow(/does not exist/);
		});
	});

	describe("array element selection", () => {
		test("selects array element schema", () => {
			const result = SelectZodSchemaAt(schema, "users[]");
			const valid = { name: "John", address: { city: "NYC", zip: 10001 } };
			expect(result.parse(valid)).toEqual(valid);
		});

		test("selects array element property", () => {
			const result = SelectZodSchemaAt(schema, "users[].name");
			expect(result.parse("John")).toBe("John");
			expect(() => result.parse(123)).toThrow();
		});

		test("selects deep array element property", () => {
			const result = SelectZodSchemaAt(schema, "users[].address.city");
			expect(result.parse("NYC")).toBe("NYC");
		});

		test("throws on [] with non-array", () => {
			expect(() => SelectZodSchemaAt(schema, "name[]")).toThrow(/non-array/);
		});
	});

	describe("record value selection", () => {
		test("selects record value schema", () => {
			const result = SelectZodSchemaAt(schema, "config[]");
			expect(result.parse(true)).toBe(true);
			expect(() => result.parse("string")).toThrow();
		});
	});

	describe("tuple index selection", () => {
		test("selects tuple element by index", () => {
			const first = SelectZodSchemaAt(schema, "coords[0]");
			expect(first.parse(42)).toBe(42);
			expect(() => first.parse("string")).toThrow();

			const third = SelectZodSchemaAt(schema, "coords[2]");
			expect(third.parse("label")).toBe("label");
			expect(() => third.parse(123)).toThrow();
		});

		test("throws on out of bounds index", () => {
			expect(() => SelectZodSchemaAt(schema, "coords[5]")).toThrow(/out of bounds/);
		});

		test("throws on index with non-tuple", () => {
			expect(() => SelectZodSchemaAt(schema, "name[0]")).toThrow(/non-tuple/);
		});
	});

	describe("union variant selection", () => {
		test("selects union variant by index", () => {
			const okVariant = SelectZodSchemaAt(schema, "status[0]");
			expect(okVariant.parse({ type: "ok", data: "success" })).toEqual({
				type: "ok",
				data: "success",
			});

			const errorVariant = SelectZodSchemaAt(schema, "status[1]");
			expect(errorVariant.parse({ type: "error", message: "failed" })).toEqual({
				type: "error",
				message: "failed",
			});
		});

		test("selects union variant property", () => {
			const result = SelectZodSchemaAt(schema, "status[0].data");
			expect(result.parse("success")).toBe("success");

			const message = SelectZodSchemaAt(schema, "status[1].message");
			expect(message.parse("error message")).toBe("error message");
		});

		test("throws on out of bounds union index", () => {
			expect(() => SelectZodSchemaAt(schema, "status[5]")).toThrow(/out of bounds/);
		});
	});

	describe("wrapper types", () => {
		test("preserves optional wrapper", () => {
			const result = SelectZodSchemaAt(schema, "optionalField");
			expect(result.parse("hello")).toBe("hello");
			expect(result.parse(undefined)).toBe(undefined);
		});

		test("preserves nullable wrapper", () => {
			const result = SelectZodSchemaAt(schema, "nullableField");
			expect(result.parse("hello")).toBe("hello");
			expect(result.parse(null)).toBe(null);
		});

		test("preserves default wrapper", () => {
			const result = SelectZodSchemaAt(schema, "defaultField");
			expect(result.parse("hello")).toBe("hello");
			expect(result.parse(undefined)).toBe("default");
		});

		test("traverses through optional to nested property", () => {
			const result = SelectZodSchemaAt(schema, "users[].email");
			// email is optional, so the schema is ZodOptional<ZodString>
			expect(result.parse("test@example.com")).toBe("test@example.com");
			expect(result.parse(undefined)).toBe(undefined);
		});
	});

	describe("mixed paths", () => {
		test("complex nested path", () => {
			const result = SelectZodSchemaAt(schema, "users[].address.city");
			expect(result.parse("New York")).toBe("New York");
		});

		test("union then object property", () => {
			const result = SelectZodSchemaAt(schema, "status[0].type");
			expect(result.parse("ok")).toBe("ok");
		});
	});

	describe("error messages", () => {
		test("includes path in error for invalid property", () => {
			expect(() => SelectZodSchemaAt(schema, "users[].nonexistent")).toThrow(
				/users\[\]\.nonexistent/
			);
		});

		test("includes path in error for invalid access", () => {
			expect(() => SelectZodSchemaAt(schema, "name[]")).toThrow(/name\[\]/);
		});
	});

	describe("empty path", () => {
		test("returns original schema for empty path", () => {
			const result = SelectZodSchemaAt(schema, "");
			expect(result).toBe(schema);
		});
	});
});

describe("path parsing edge cases", () => {
	test("handles consecutive brackets", () => {
		const nested = z.array(z.array(z.string()));
		const result = SelectZodSchemaAt(nested, "[][]");
		expect(result.parse("hello")).toBe("hello");
	});

	test("handles path starting with bracket", () => {
		const arr = z.array(z.object({ name: z.string() }));
		const result = SelectZodSchemaAt(arr, "[].name");
		expect(result.parse("John")).toBe("John");
	});

	test("throws on unclosed bracket", () => {
		expect(() => SelectZodSchemaAt(schema, "users[")).toThrow(/unclosed bracket/);
	});

	test("throws on negative index", () => {
		expect(() => SelectZodSchemaAt(schema, "coords[-1]")).toThrow(/invalid index/);
	});

	test("throws on non-numeric index", () => {
		expect(() => SelectZodSchemaAt(schema, "coords[abc]")).toThrow(/invalid index/);
	});
});
