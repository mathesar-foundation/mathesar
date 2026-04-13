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
  // The cast narrows unknown → T. This is safe because generateFromSchema
  // produces a value structurally matching the schema by construction.
  return generateFromSchema(schema) as T;
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
    const result: Record<string, unknown> = {};
    for (const [key, fieldSchema] of Object.entries(schema.shape)) {
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
    return schema.options[0];
  }

  if (schema instanceof z.ZodLiteral) {
    return schema.value;
  }

  if (schema instanceof z.ZodUnion) {
    // Zod v4: options elements are $ZodType (internal) not ZodType (public).
    return generateFromSchema(schema.options[0] as z.ZodType);
  }

  if (schema instanceof z.ZodNullable) {
    return null;
  }

  if (schema instanceof z.ZodDefault) {
    // Zod v4: removeDefault() returns $ZodType (internal) not ZodType (public).
    // The cast bridges this gap; the runtime value IS a ZodType instance.
    return generateFromSchema(schema.removeDefault() as z.ZodType);
  }

  if (schema instanceof z.ZodPipe) {
    // Zod v4: _def.in is typed as $ZodType (internal) not ZodType (public).
    return generateFromSchema(schema._def.in as z.ZodType);
  }

  // Fallback: return undefined for unknown schema types
  return undefined;
}
