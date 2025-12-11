import { test, expect, describe } from "bun:test";
import { z } from "zod";

import { select, type SchemaAt, type InferAt } from "../src";

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

describe("SchemaAt type", () => {
	test("type assignments compile correctly", () => {
		// Object properties
		const t1: SchemaAt<typeof schema, "name"> = z.string();
		t1;

		// Deep nesting
		const t2: SchemaAt<typeof schema, "deep.a.b"> = z.object({ c: z.string() });
		t2;

		const t3: SchemaAt<typeof schema, "deep.a.b.c"> = z.string();
		t3;

		// Array element
		const t4: SchemaAt<typeof schema, "users[]"> = z.object({
			name: z.string(),
			email: z.string().optional(),
			address: z.object({ city: z.string(), zip: z.number() }),
		});
		t4;

		// Array element property
		const t5: SchemaAt<typeof schema, "users[].name"> = z.string();
		t5;

		// Record value
		const t6: SchemaAt<typeof schema, "config[]"> = z.boolean();
		t6;

		// Tuple index
		const t7: SchemaAt<typeof schema, "coords[0]"> = z.number();
		t7;

		const t8: SchemaAt<typeof schema, "coords[2]"> = z.string();
		t8;

		// Union variant
		const t9: SchemaAt<typeof schema, "status[0]"> = z.object({
			type: z.literal("ok"),
			data: z.string(),
		});
		t9;

		const t10: SchemaAt<typeof schema, "status[0].data"> = z.string();
		t10;

		// Optional field (preserved)
		const t11: SchemaAt<typeof schema, "optionalField"> = z.string().optional();
		t11;
	});
});

describe("InferAt type", () => {
	test("type assignments compile correctly", () => {
		// Basic property
		const t1: InferAt<typeof schema, "name"> = "hello";
		t1;

		// Deep nesting
		const t2: InferAt<typeof schema, "deep.a.b.c"> = "hello";
		t2;

		// Array element property
		const t3: InferAt<typeof schema, "users[].name"> = "hello";
		t3;

		// Optional field includes undefined
		const t4: InferAt<typeof schema, "optionalField"> = undefined;
		const t5: InferAt<typeof schema, "optionalField"> = "hello";
		t4;
		t5;

		// Nullable field includes null
		const t6: InferAt<typeof schema, "nullableField"> = null;
		const t7: InferAt<typeof schema, "nullableField"> = "hello";
		t6;
		t7;

		// Tuple element
		const t8: InferAt<typeof schema, "coords[0]"> = 42;
		t8;

		// Union variant property
		const t9: InferAt<typeof schema, "status[0].data"> = "hello";
		t9;
	});
});

describe("select runtime", () => {
	describe("object property selection", () => {
		test("selects top-level property", () => {
			const result = select(schema, "name");
			expect(result.parse("John")).toBe("John");
			expect(() => result.parse(123)).toThrow();
		});

		test("selects nested property", () => {
			const result = select(schema, "deep.a.b.c");
			expect(result.parse("hello")).toBe("hello");
			expect(() => result.parse(123)).toThrow();
		});

		test("throws on invalid property", () => {
			expect(() => select(schema, "nonexistent")).toThrow(/does not exist/);
		});
	});

	describe("array element selection", () => {
		test("selects array element schema", () => {
			const result = select(schema, "users[]");
			const valid = { name: "John", address: { city: "NYC", zip: 10001 } };
			expect(result.parse(valid)).toEqual(valid);
		});

		test("selects array element property", () => {
			const result = select(schema, "users[].name");
			expect(result.parse("John")).toBe("John");
			expect(() => result.parse(123)).toThrow();
		});

		test("selects deep array element property", () => {
			const result = select(schema, "users[].address.city");
			expect(result.parse("NYC")).toBe("NYC");
		});

		test("throws on [] with non-array", () => {
			expect(() => select(schema, "name[]")).toThrow(/non-array/);
		});
	});

	describe("record value selection", () => {
		test("selects record value schema", () => {
			const result = select(schema, "config[]");
			expect(result.parse(true)).toBe(true);
			expect(() => result.parse("string")).toThrow();
		});
	});

	describe("tuple index selection", () => {
		test("selects tuple element by index", () => {
			const first = select(schema, "coords[0]");
			expect(first.parse(42)).toBe(42);
			expect(() => first.parse("string")).toThrow();

			const third = select(schema, "coords[2]");
			expect(third.parse("label")).toBe("label");
			expect(() => third.parse(123)).toThrow();
		});

		test("throws on out of bounds index", () => {
			expect(() => select(schema, "coords[5]")).toThrow(/out of bounds/);
		});

		test("throws on index with non-tuple", () => {
			expect(() => select(schema, "name[0]")).toThrow(/non-tuple/);
		});
	});

	describe("union variant selection", () => {
		test("selects union variant by index", () => {
			const okVariant = select(schema, "status[0]");
			expect(okVariant.parse({ type: "ok", data: "success" })).toEqual({
				type: "ok",
				data: "success",
			});

			const errorVariant = select(schema, "status[1]");
			expect(errorVariant.parse({ type: "error", message: "failed" })).toEqual({
				type: "error",
				message: "failed",
			});
		});

		test("selects union variant property", () => {
			const result = select(schema, "status[0].data");
			expect(result.parse("success")).toBe("success");

			const message = select(schema, "status[1].message");
			expect(message.parse("error message")).toBe("error message");
		});

		test("throws on out of bounds union index", () => {
			expect(() => select(schema, "status[5]")).toThrow(/out of bounds/);
		});
	});

	describe("wrapper types", () => {
		test("preserves optional wrapper", () => {
			const result = select(schema, "optionalField");
			expect(result.parse("hello")).toBe("hello");
			expect(result.parse(undefined)).toBe(undefined);
		});

		test("preserves nullable wrapper", () => {
			const result = select(schema, "nullableField");
			expect(result.parse("hello")).toBe("hello");
			expect(result.parse(null)).toBe(null);
		});

		test("preserves default wrapper", () => {
			const result = select(schema, "defaultField");
			expect(result.parse("hello")).toBe("hello");
			expect(result.parse(undefined)).toBe("default");
		});

		test("traverses through optional to nested property", () => {
			const result = select(schema, "users[].email");
			// email is optional, so the schema is ZodOptional<ZodString>
			expect(result.parse("test@example.com")).toBe("test@example.com");
			expect(result.parse(undefined)).toBe(undefined);
		});
	});

	describe("mixed paths", () => {
		test("complex nested path", () => {
			const result = select(schema, "users[].address.city");
			expect(result.parse("New York")).toBe("New York");
		});

		test("union then object property", () => {
			const result = select(schema, "status[0].type");
			expect(result.parse("ok")).toBe("ok");
		});
	});

	describe("error messages", () => {
		test("includes path in error for invalid property", () => {
			expect(() => select(schema, "users[].nonexistent")).toThrow(
				/users\[\]\.nonexistent/
			);
		});

		test("includes path in error for invalid access", () => {
			expect(() => select(schema, "name[]")).toThrow(/name\[\]/);
		});
	});

	describe("empty path", () => {
		test("returns original schema for empty path", () => {
			const result = select(schema, "");
			expect(result).toBe(schema);
		});
	});
});

describe("path parsing edge cases", () => {
	test("handles consecutive brackets", () => {
		const nested = z.array(z.array(z.string()));
		const result = select(nested, "[][]");
		expect(result.parse("hello")).toBe("hello");
	});

	test("handles path starting with bracket", () => {
		const arr = z.array(z.object({ name: z.string() }));
		const result = select(arr, "[].name");
		expect(result.parse("John")).toBe("John");
	});

	test("throws on unclosed bracket", () => {
		expect(() => select(schema, "users[")).toThrow(/unclosed bracket/);
	});

	test("throws on negative index", () => {
		expect(() => select(schema, "coords[-1]")).toThrow(/invalid index/);
	});

	test("throws on non-numeric index", () => {
		expect(() => select(schema, "coords[abc]")).toThrow(/invalid index/);
	});
});
