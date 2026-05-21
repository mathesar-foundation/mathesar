import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { generateFakeValue } from '../engine/zod-fake';

describe('generateFakeValue', () => {
  it('z.string() returns a string', () => {
    const result = generateFakeValue(z.string());
    expect(typeof result).toBe('string');
  });

  it('z.number() returns a number', () => {
    const result = generateFakeValue(z.number());
    expect(typeof result).toBe('number');
  });

  it('z.boolean() returns a boolean', () => {
    const result = generateFakeValue(z.boolean());
    expect(typeof result).toBe('boolean');
  });

  it('z.object({ a: z.string(), b: z.number() }) returns correct shape', () => {
    const schema = z.object({ a: z.string(), b: z.number() });
    const result = generateFakeValue(schema);
    expect(typeof result.a).toBe('string');
    expect(typeof result.b).toBe('number');
  });

  it('z.array(z.string()) returns an empty array', () => {
    const result = generateFakeValue(z.array(z.string()));
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
  });

  it('z.optional(z.string()) returns undefined', () => {
    const result = generateFakeValue(z.optional(z.string()));
    expect(result).toBeUndefined();
  });

  it('z.enum returns first enum value', () => {
    const result = generateFakeValue(z.enum(['a', 'b', 'c']));
    expect(result).toBe('a');
  });

  it('z.literal returns the literal value', () => {
    expect(generateFakeValue(z.literal('foo'))).toBe('foo');
    expect(generateFakeValue(z.literal(42))).toBe(42);
    expect(generateFakeValue(z.literal(true))).toBe(true);
  });

  it('z.union returns fake for first variant', () => {
    const result = generateFakeValue(z.union([z.string(), z.number()]));
    expect(typeof result).toBe('string');
  });

  it('nested objects generate correct shapes', () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
        age: z.number(),
        active: z.boolean(),
      }),
      tags: z.array(z.string()),
    });
    const result = generateFakeValue(schema);
    expect(typeof result.user.name).toBe('string');
    expect(typeof result.user.age).toBe('number');
    expect(typeof result.user.active).toBe('boolean');
    expect(Array.isArray(result.tags)).toBe(true);
  });

  it('z.object({}) returns empty object', () => {
    const result = generateFakeValue(z.object({}));
    expect(result).toEqual({});
  });

  it('generated values pass schema parse for simple schemas', () => {
    expect(() => z.string().parse(generateFakeValue(z.string()))).not.toThrow();
    expect(() => z.number().parse(generateFakeValue(z.number()))).not.toThrow();
    expect(() => z.boolean().parse(generateFakeValue(z.boolean()))).not.toThrow();
    expect(() => z.array(z.string()).parse(generateFakeValue(z.array(z.string())))).not.toThrow();
    expect(() => z.object({}).parse(generateFakeValue(z.object({})))).not.toThrow();

    const objSchema = z.object({ name: z.string(), count: z.number() });
    expect(() => objSchema.parse(generateFakeValue(objSchema))).not.toThrow();
  });

  it('z.nullable returns null', () => {
    const result = generateFakeValue(z.nullable(z.string()));
    expect(result).toBeNull();
  });
});
