import { z } from 'zod';

/**
 * Generate a fake value that matches a Zod schema's type.
 * Used during dry-run to produce real typed values without running closures.
 *
 * The generated values are structurally correct (right types, right shape)
 * so that any computation in the scenario body (string concat, method calls,
 * property access) works naturally.
 */
export function generateFakeValue<T>(schema: z.ZodType<T>): T {
  return generateFromSchema(schema as z.ZodType) as T;
}

function generateFromSchema(schema: z.ZodType): unknown {
  if (schema instanceof z.ZodString) {
    return 'fake_string';
  }

  if (schema instanceof z.ZodNumber) {
    return 0;
  }

  if (schema instanceof z.ZodBoolean) {
    return false;
  }

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodType>;
    const result: Record<string, unknown> = {};
    for (const [key, fieldSchema] of Object.entries(shape)) {
      result[key] = generateFromSchema(fieldSchema);
    }
    return result;
  }

  if (schema instanceof z.ZodArray) {
    return [];
  }

  if (schema instanceof z.ZodOptional) {
    return undefined;
  }

  if (schema instanceof z.ZodEnum) {
    const values = schema.options as readonly string[];
    return values[0];
  }

  if (schema instanceof z.ZodLiteral) {
    return schema.value;
  }

  if (schema instanceof z.ZodUnion) {
    const options = schema.options as z.ZodType[];
    return generateFromSchema(options[0]);
  }

  if (schema instanceof z.ZodNullable) {
    return null;
  }

  if (schema instanceof z.ZodDefault) {
    // unwrap() returns the inner schema without the default wrapper
    return generateFromSchema((schema as any).unwrap());
  }

  if (schema instanceof z.ZodPipe) {
    // ZodPipe wraps transforms in zod v4 — unwrap to the input schema
    return generateFromSchema((schema as any)._def.in);
  }

  // Fallback: return undefined for unknown schema types
  return undefined;
}
