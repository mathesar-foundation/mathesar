import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { defineResource } from '../engine/define-resource';
import { defineTask } from '../engine/define-task';
import { taskDryRun } from '../engine/task-dry-run';
import { taskExecute } from '../engine/task-executor';
import { compareTaskStepTrees } from '../engine/task-step-tree-compare';
import { outcomeStore } from '../store/outcome-store';
import { resourceStore } from '../store/resource-store';
import { registry } from '../store/registry';
import { createMockFixtures } from './test-utils';
import type { TaskHandle, TestFixtures, TaskContext } from '../types';

beforeEach(() => {
  registry.clear();
  outcomeStore.clear();
  resourceStore.clear();
});

/**
 * Helper: create a TaskHandle without registering in the registry.
 */
function quickTaskHandle<TParams, TOutcome>(
  code: string,
  paramsSchema: z.ZodType<TParams>,
  outcomeSchema: z.ZodType<TOutcome>,
  taskFn: (t: TaskContext, params: TParams) => Promise<TOutcome>,
  opts?: {
    programmatic?: (params: TParams) => Promise<TOutcome>;
    restore?: (fixtures: TestFixtures, outcome: TOutcome) => Promise<void>;
  },
): TaskHandle<TParams, TOutcome> {
  return {
    code,
    paramsSchema,
    outcomeSchema,
    taskFn,
    programmaticFn: opts?.programmatic,
    restoreFn: opts?.restore,
  };
}

describe('task dry-run', () => {
  it('captures ensure and perform nodes in step tree', async () => {
    const child = quickTaskHandle(
      'child',
      z.object({}),
      z.object({ value: z.number() }),
      async () => ({ value: 42 }),
    );

    const parent = quickTaskHandle(
      'parent',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.ensure(child, {});
        await t.perform(child, {});
        return {};
      },
    );

    const result = await taskDryRun(parent, {});

    expect(result.stepTree).toHaveLength(2);
    expect(result.stepTree[0].type).toBe('ensure');
    expect(result.stepTree[1].type).toBe('perform');
  });

  it('captures action with resource declaration', async () => {
    const Database = defineResource({
      type: 'database',
      schema: z.object({ name: z.string() }),
      key: (db) => db.name,
    });

    const task = quickTaskHandle(
      'create-db',
      z.object({}),
      z.object({ database: Database.schema }),
      async (t) => {
        const result = await t.action('Create database', {
          schema: z.object({ database: Database.schema }),
          resource: Database.creates('database'),
          fn: async () => ({ database: { name: 'Movies' } }),
        });
        return result;
      },
    );

    const result = await taskDryRun(task, {});

    expect(result.stepTree).toHaveLength(1);
    expect(result.stepTree[0].type).toBe('action');
    if (result.stepTree[0].type === 'action') {
      expect(result.stepTree[0].resource).toBeDefined();
      expect(result.stepTree[0].resource!.op).toBe('create');
      expect(result.stepTree[0].resource!.field).toBe('database');
    }
  });

  it('detects circular dependencies', async () => {
    // Create circular: A → B → A
    const handleA: TaskHandle = {
      code: 'circular-a',
      paramsSchema: z.object({}),
      outcomeSchema: z.object({}),
      taskFn: async (t) => {
        await t.ensure(handleB, {});
        return {};
      },
    };

    const handleB: TaskHandle = {
      code: 'circular-b',
      paramsSchema: z.object({}),
      outcomeSchema: z.object({}),
      taskFn: async (t) => {
        await t.ensure(handleA, {});
        return {};
      },
    };

    await expect(taskDryRun(handleA, {})).rejects.toThrow(
      /Circular dependency/,
    );
  });
});

describe('task execution', () => {
  it('executes action closures and records resource operations', async () => {
    const Database = defineResource({
      type: 'database',
      schema: z.object({ name: z.string() }),
      key: (db) => db.name,
    });

    const task = quickTaskHandle(
      'create-db',
      z.object({ dbName: z.string() }),
      z.object({ database: Database.schema }),
      async (t, params) => {
        const result = await t.action('Create database', {
          schema: z.object({ database: Database.schema }),
          resource: Database.creates('database'),
          fn: async () => ({ database: { name: params.dbName } }),
        });
        return result;
      },
    );

    const fixtures = createMockFixtures() as unknown as TestFixtures;
    const result = await taskExecute(fixtures, task, { dbName: 'Movies' });

    expect(result.outcome).toEqual({ database: { name: 'Movies' } });

    // Resource should be recorded in the resource store
    expect(resourceStore.has('database', 'Movies')).toBe(true);
    const instance = resourceStore.get('database', 'Movies');
    expect(instance!.state).toEqual({ name: 'Movies' });
    expect(instance!.createdBy).toBe('create-db');
  });

  it('records child resources via .with() chaining', async () => {
    const Database = defineResource({
      type: 'database',
      schema: z.object({ name: z.string() }),
      key: (db) => db.name,
    });

    const Schema = defineResource({
      type: 'schema',
      schema: z.object({ dbName: z.string(), schemaName: z.string() }),
      key: (s) => `${s.dbName}/${s.schemaName}`,
      parent: { type: Database, key: (s) => s.dbName },
    });

    const task = quickTaskHandle(
      'create-db-with-schema',
      z.object({}),
      z.object({ database: Database.schema, schema: Schema.schema }),
      async (t) => {
        const result = await t.action('Create database with schema', {
          schema: z.object({
            database: Database.schema,
            schema: Schema.schema,
          }),
          resource: Database.creates('database').with(
            Schema.creates('schema'),
          ),
          fn: async () => ({
            database: { name: 'Movies' },
            schema: { dbName: 'Movies', schemaName: 'public' },
          }),
        });
        return result;
      },
    );

    const fixtures = createMockFixtures() as unknown as TestFixtures;
    await taskExecute(fixtures, task, {});

    expect(resourceStore.has('database', 'Movies')).toBe(true);
    expect(resourceStore.has('schema', 'Movies/public')).toBe(true);
  });

  it('ensure uses programmatic path when available', async () => {
    const calls: string[] = [];

    const child = quickTaskHandle(
      'child-prog',
      z.object({}),
      z.object({ value: z.number() }),
      async (t) => {
        return await t.action('Do work', {
          schema: z.object({ value: z.number() }),
          fn: async () => {
            calls.push('manual');
            return { value: 42 };
          },
        });
      },
      {
        programmatic: async () => {
          calls.push('programmatic');
          return { value: 42 };
        },
      },
    );

    const parent = quickTaskHandle(
      'parent-prog',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.ensure(child, {});
        return {};
      },
    );

    const fixtures = createMockFixtures() as unknown as TestFixtures;
    await taskExecute(fixtures, parent, {});

    expect(calls).toEqual(['programmatic']);
  });

  it('perform always uses manual path', async () => {
    const calls: string[] = [];

    const child = quickTaskHandle(
      'child-manual',
      z.object({}),
      z.object({ value: z.number() }),
      async (t) => {
        return await t.action('Do work', {
          schema: z.object({ value: z.number() }),
          fn: async () => {
            calls.push('manual');
            return { value: 42 };
          },
        });
      },
      {
        programmatic: async () => {
          calls.push('programmatic');
          return { value: 42 };
        },
      },
    );

    const parent = quickTaskHandle(
      'parent-manual',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.perform(child, {});
        return {};
      },
    );

    const fixtures = createMockFixtures() as unknown as TestFixtures;
    await taskExecute(fixtures, parent, {});

    expect(calls).toEqual(['manual']);
  });

  it('step tree matches between dry-run and execution', async () => {
    const Database = defineResource({
      type: 'database',
      schema: z.object({ name: z.string() }),
      key: (db) => db.name,
    });

    const child = quickTaskHandle(
      'child-tree',
      z.object({}),
      z.object({ value: z.number() }),
      async () => ({ value: 1 }),
    );

    const task = quickTaskHandle(
      'parent-tree',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.ensure(child, {});
        await t.action('Do something', {
          schema: z.object({ database: Database.schema }),
          resource: Database.creates('database'),
          fn: async () => ({ database: { name: 'Test' } }),
        });
        await t.check('Verify', async () => {});
        return {};
      },
    );

    const dryRunResult = await taskDryRun(task, {});
    const fixtures = createMockFixtures() as unknown as TestFixtures;
    const execResult = await taskExecute(fixtures, task, {});

    const mismatch = compareTaskStepTrees(
      'parent-tree',
      dryRunResult.stepTree,
      execResult.stepTree,
    );
    expect(mismatch).toBeNull();
  });

  it('validates action return value against schema', async () => {
    const task = quickTaskHandle(
      'bad-action',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.action('Bad action', {
          schema: z.object({ name: z.string() }),
          fn: async () => ({ name: 123 }) as any,
        });
        return {};
      },
    );

    const fixtures = createMockFixtures() as unknown as TestFixtures;
    await expect(taskExecute(fixtures, task, {})).rejects.toThrow(
      /returned invalid data/,
    );
  });

  it('data flows between ensure/perform and actions', async () => {
    const child = quickTaskHandle(
      'data-producer',
      z.object({ x: z.number() }),
      z.object({ doubled: z.number() }),
      async (t, params) => {
        return await t.action('Double', {
          schema: z.object({ doubled: z.number() }),
          fn: async () => ({ doubled: params.x * 2 }),
        });
      },
    );

    const parent = quickTaskHandle(
      'data-consumer',
      z.object({}),
      z.object({ result: z.number() }),
      async (t) => {
        const child1 = await t.ensure(child, { x: 5 });
        const child2 = await t.perform(child, { x: 10 });
        return { result: child1.doubled + child2.doubled };
      },
    );

    const fixtures = createMockFixtures() as unknown as TestFixtures;
    const result = await taskExecute(fixtures, parent, {});

    expect(result.outcome).toEqual({ result: 30 });
  });
});
