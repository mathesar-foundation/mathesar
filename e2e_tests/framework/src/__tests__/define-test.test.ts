import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { defineTest } from '../engine/define-test';
import { registry } from '../store/registry';
import { resetRegistry } from './test-utils';

beforeEach(() => {
  resetRegistry();
});

describe('defineTest', () => {
  it('returns a TestHandle with correct code, schemas, and scenario function', () => {
    const paramsSchema = z.object({ name: z.string() });
    const outcomeSchema = z.object({ id: z.number() });
    const scenarioFn = async (t: any, params: any) => ({ id: 1 });

    const handle = defineTest({
      code: 'my-test',
      params: paramsSchema,
      outcome: outcomeSchema,
      scenario: scenarioFn,
    });

    expect(handle.code).toBe('my-test');
    expect(handle.paramsSchema).toBe(paramsSchema);
    expect(handle.outcomeSchema).toBe(outcomeSchema);
    expect(handle.scenarioFn).toBe(scenarioFn);
  });

  it('registers test in the global registry', () => {
    defineTest({
      code: 'registered-test',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async () => ({}),
      standalone: { params: {} },
    });

    const entry = registry.get('registered-test');
    expect(entry).toBeDefined();
    expect(entry!.handle.code).toBe('registered-test');
    expect(entry!.standaloneParams).toEqual({});
  });

  it('prevents duplicate test code registration', () => {
    defineTest({
      code: 'unique-test',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async () => ({}),
    });

    expect(() =>
      defineTest({
        code: 'unique-test',
        params: z.object({}),
        outcome: z.object({}),
        scenario: async () => ({}),
      }),
    ).toThrow(/Duplicate test code 'unique-test'/);
  });

  it('validates standalone params against params schema', () => {
    expect(() =>
      defineTest({
        code: 'bad-standalone',
        params: z.object({ name: z.string() }),
        outcome: z.object({}),
        scenario: async () => ({}),
        standalone: { params: { name: 123 } as any },
      }),
    ).toThrow(/Standalone params for test 'bad-standalone' do not match/);
  });

  it('TestHandle is usable as t.step() reference', async () => {
    const childHandle = defineTest({
      code: 'child-ref-test',
      params: z.object({ x: z.number() }),
      outcome: z.object({ doubled: z.number() }),
      scenario: async (t, params) => ({ doubled: params.x * 2 }),
    });

    // The handle can be referenced in another test's step
    const parentHandle = defineTest({
      code: 'parent-ref-test',
      params: z.object({}),
      outcome: z.object({ result: z.number() }),
      scenario: async (t) => {
        const child = await t.step('Double 5', childHandle, { x: 5 });
        return { result: child.doubled };
      },
      standalone: { params: {} },
    });

    expect(parentHandle.code).toBe('parent-ref-test');
    // The handle types are correct (compilation check)
    expect(childHandle.code).toBe('child-ref-test');
  });

  it('registers without standalone params when not provided', () => {
    defineTest({
      code: 'no-standalone',
      params: z.object({ name: z.string() }),
      outcome: z.object({}),
      scenario: async () => ({}),
    });

    const entry = registry.get('no-standalone');
    expect(entry).toBeDefined();
    expect(entry!.standaloneParams).toBeUndefined();
  });
});
