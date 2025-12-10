import { z } from "zod";

import {
	type ZodSchemaAt,
	selectZodSchemaAt,
} from "../src";

function test() {
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

	const t1: ZodSchemaAt<typeof schema, "name"> = z.string(); t1;
	const t2: ZodSchemaAt<typeof schema, "deep.a.b"> = z.object({ c: z.string() }); t2;
	const t3: ZodSchemaAt<typeof schema, "metrics.height.0"> = z.object({ unit: z.literal("cm"), valueCm: z.number() }); t3;
	const t4: ZodSchemaAt<typeof schema, "children.*"> = z.number(); t4;
	const t5: ZodSchemaAt<typeof schema, "infos.*"> = z.string(); t5;
	const t6: ZodSchemaAt<typeof schema, "infos"> = z.array(z.string()); t6;
	const t7: ZodSchemaAt<typeof schema, "tuple.2"> = z.boolean(); t7;

	const test = <P extends string, V>(path: P, inputValue: V, expectPass: boolean) => {
		let passed: boolean = false;

		try {
			const value = (selectZodSchemaAt(schema, path) as z.ZodTypeAny).parse(inputValue);
			if (expectPass) {
				passed = true;
			}

		} catch (_e) {
			if (!expectPass) {
				passed = true;
			} else {
				console.error(_e);
			}
		}

		return passed;
	}

	const results = [
		test("name", "John Doe", true),
		test("name", 3, false),
		test("deep.a", { b: { c: "hello" } }, true),
		test("deep.a", "hello", false),
		test("deep.a.b.c", "hello", true),
		test("deep.a.b.c", 0, false),
		test("gender", "male", true),
		test("gender", "bouh", false),
		test("metrics.age", 4, true),
		test("metrics.age", "youpee", false),
		test("metrics.height", { unit: "cm", valueCm: 3 }, true),
		test("metrics.height", { unit: "cm", valueIn: 3 }, false),
		test("metrics.height.1.valueIn", 3, true),
		test("metrics.height.1.valueIn", "zorro", false),
		test("children", { A: 8, B: 13 }, true),
		test("children", 13, false),
		test("children.*", 13, true),
		test("children.*", "a", false),
		test("infos", ["nice", "car"], true),
		test("infos", "nice", false),
		test("infos.*", "nice", true),
		test("infos.*", ["nice"], false),
		test("tuple.0", "hello", true),
		test("tuple.0", 0, false),
		test("tuple.1", 0, true),
		test("tuple.2", true, true),
		test("tuple", ["ok", 4, false], true),
	];

	if (results.every(ok => ok)) {
		console.log(`All ${results.length} runtime tests passed`);
	}
}

test();
