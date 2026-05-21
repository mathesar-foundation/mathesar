import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { defineTask } from '../engine/define-task';
import { registry } from '../store/registry';
import { resetRegistry } from './test-utils';

beforeEach(() => {
  resetRegistry();
});

describe('defineTask', () => {
  it('returns a TaskHandle with correct code, schemas, and functions', () => {
    const paramsSchema = z.object({ name: z.string() });
    const outcomeSchema = z.object({ id: z.number() });
    const taskFn = async (t: any, params: any) => ({ id: 1 });

    const handle = defineTask({
      code: 'my-task',
      params: paramsSchema,
      outcome: outcomeSchema,
      task: taskFn,
    });

    expect(handle.code).toBe('my-task');
    expect(handle.paramsSchema).toBe(paramsSchema);
    expect(handle.outcomeSchema).toBe(outcomeSchema);
    expect(handle.taskFn).toBe(taskFn);
    expect(handle.programmaticFn).toBeUndefined();
    expect(handle.restoreFn).toBeUndefined();
  });

  it('stores programmatic function when provided', () => {
    const programmaticFn = async (params: { name: string }) => ({ id: 1 });

    const handle = defineTask({
      code: 'prog-task',
      params: z.object({ name: z.string() }),
      outcome: z.object({ id: z.number() }),
      task: async () => ({ id: 1 }),
      programmatic: programmaticFn,
    });

    expect(handle.programmaticFn).toBe(programmaticFn);
  });

  it('stores restore function when provided', () => {
    const restoreFn = async (fixtures: any, outcome: any) => {};

    const handle = defineTask({
      code: 'restore-task',
      params: z.object({}),
      outcome: z.object({ token: z.string() }),
      task: async () => ({ token: 'abc' }),
      restore: restoreFn,
    });

    expect(handle.restoreFn).toBe(restoreFn);
  });

  it('registers task in the global registry', () => {
    defineTask({
      code: 'registered-task',
      params: z.object({}),
      outcome: z.object({}),
      task: async () => ({}),
      standalone: { params: {} },
    });

    const entry = registry.get('registered-task');
    expect(entry).toBeDefined();
    expect(entry!.handle.code).toBe('registered-task');
    expect(entry!.standaloneParams).toEqual({});
    expect(entry!.handle.code).toBe('registered-task');
  });

  it('prevents duplicate code registration', () => {
    defineTask({
      code: 'unique-task',
      params: z.object({}),
      outcome: z.object({}),
      task: async () => ({}),
    });

    expect(() =>
      defineTask({
        code: 'unique-task',
        params: z.object({}),
        outcome: z.object({}),
        task: async () => ({}),
      }),
    ).toThrow(/Duplicate test code 'unique-task'/);
  });

  it('validates standalone params against params schema', () => {
    expect(() =>
      defineTask({
        code: 'bad-standalone-task',
        params: z.object({ name: z.string() }),
        outcome: z.object({}),
        task: async () => ({}),
        standalone: { params: { name: 123 } as any },
      }),
    ).toThrow(/Standalone params for task 'bad-standalone-task' do not match/);
  });

  it('registers without standalone params when not provided', () => {
    defineTask({
      code: 'no-standalone-task',
      params: z.object({ name: z.string() }),
      outcome: z.object({}),
      task: async () => ({}),
    });

    const entry = registry.get('no-standalone-task');
    expect(entry).toBeDefined();
    expect(entry!.standaloneParams).toBeUndefined();
  });
});
