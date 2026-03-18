import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { defineTest } from '../engine/define-test';
import { dryRun } from '../engine/dry-run';
import { execute } from '../engine/executor';
import { buildDag } from '../engine/dag';
import { compareStepTrees } from '../engine/step-tree-compare';
import { createMockPage, resetRegistry } from './test-utils';

beforeEach(() => {
  resetRegistry();
});

describe('integration', () => {
  it('full pipeline: define → dry-run → build DAG → validate → execute', async () => {
    const handle = defineTest({
      code: 'full-pipeline',
      params: z.object({ name: z.string() }),
      outcome: z.object({ greeting: z.string() }),
      scenario: async (t, params) => {
        const result = await t.action(
          'Create greeting',
          z.object({ greeting: z.string() }),
          async () => ({ greeting: `Hello, ${params.name}!` }),
        );
        await t.check('Verify greeting', async () => {
          // assertion placeholder
        });
        return { greeting: result.greeting };
      },
      standalone: { params: { name: 'World' } },
    });

    // Dry-run
    const dryRunResult = await dryRun(handle, { name: 'World' });
    expect(dryRunResult.stepTree).toHaveLength(2);

    // Build DAG
    const dag = await buildDag();
    expect(dag.errors).toEqual([]);
    expect(dag.nodes.has('full-pipeline')).toBe(true);

    // Execute
    const mockPage = createMockPage();
    const executionResult = await execute(mockPage as any, handle, { name: 'World' });
    expect(executionResult.outcome).toEqual({ greeting: 'Hello, World!' });

    // Compare step trees
    const mismatch = compareStepTrees(
      'full-pipeline',
      dryRunResult.stepTree,
      executionResult.stepTree,
    );
    expect(mismatch).toBeNull();
  });

  it('composed tests: parent with child sub-steps', async () => {
    const child = defineTest({
      code: 'compose-child',
      params: z.object({ value: z.number() }),
      outcome: z.object({ doubled: z.number() }),
      scenario: async (t, params) => {
        const result = await t.action(
          'Double the value',
          z.object({ doubled: z.number() }),
          async () => ({ doubled: params.value * 2 }),
        );
        return { doubled: result.doubled };
      },
    });

    const parent = defineTest({
      code: 'compose-parent',
      params: z.object({}),
      outcome: z.object({ finalValue: z.number() }),
      scenario: async (t) => {
        const child1 = await t.step('Double 5', child, { value: 5 });
        return { finalValue: child1.doubled };
      },
      standalone: { params: {} },
    });

    // Dry-run
    const dryRunResult = await dryRun(parent, {});
    expect(dryRunResult.stepTree).toHaveLength(1);
    expect(dryRunResult.stepTree[0].type).toBe('step');

    // Execute
    const mockPage = createMockPage();
    const result = await execute(mockPage as any, parent, {});
    expect(result.outcome).toEqual({ finalValue: 10 });

    // Step trees match
    const mismatch = compareStepTrees('compose-parent', dryRunResult.stepTree, result.stepTree);
    expect(mismatch).toBeNull();
  });

  it('multiple uses of same test in one scenario', async () => {
    const child = defineTest({
      code: 'multi-child',
      params: z.object({ name: z.string() }),
      outcome: z.object({ result: z.string() }),
      scenario: async (t, params) => {
        const data = await t.action(
          'Process name',
          z.object({ result: z.string() }),
          async () => ({ result: `processed-${params.name}` }),
        );
        return { result: data.result };
      },
    });

    const parent = defineTest({
      code: 'multi-parent',
      params: z.object({}),
      outcome: z.object({ first: z.string(), second: z.string() }),
      scenario: async (t) => {
        const a = await t.step('Process Library', child, { name: 'Library' });
        const b = await t.step('Process Archive', child, { name: 'Archive' });
        return { first: a.result, second: b.result };
      },
      standalone: { params: {} },
    });

    // Both appear in DAG
    const dag = await buildDag();
    expect(dag.errors).toEqual([]);

    // Execute: both run independently with distinct outcomes
    const mockPage = createMockPage();
    const result = await execute(mockPage as any, parent, {});
    expect(result.outcome).toEqual({
      first: 'processed-Library',
      second: 'processed-Archive',
    });

    // Step tree has two step nodes
    expect(result.stepTree).toHaveLength(2);
  });

  it('data flow between steps', async () => {
    const setup = defineTest({
      code: 'data-flow-setup',
      params: z.object({ name: z.string() }),
      outcome: z.object({ id: z.number(), name: z.string() }),
      scenario: async (t, params) => {
        const data = await t.action(
          'Create resource',
          z.object({ id: z.number(), name: z.string() }),
          async () => ({ id: 42, name: params.name }),
        );
        return { id: data.id, name: data.name };
      },
    });

    const consumer = defineTest({
      code: 'data-flow-consumer',
      params: z.object({}),
      outcome: z.object({ summary: z.string() }),
      scenario: async (t) => {
        const resource = await t.step('Setup resource', setup, { name: 'TestDB' });
        // Data flows from step 1 to the return value
        return { summary: `Resource ${resource.name} has id ${resource.id}` };
      },
      standalone: { params: {} },
    });

    const mockPage = createMockPage();
    const result = await execute(mockPage as any, consumer, {});
    expect(result.outcome).toEqual({ summary: 'Resource TestDB has id 42' });
  });

  it('scenario return value from action outcome (Case 2 data flow)', async () => {
    const handle = defineTest({
      code: 'action-data-flow',
      params: z.object({}),
      outcome: z.object({ message: z.string() }),
      scenario: async (t) => {
        const result = await t.action(
          'Fetch message',
          z.object({ message: z.string() }),
          async () => ({ message: 'runtime-generated' }),
        );
        return { message: result.message };
      },
      standalone: { params: {} },
    });

    const mockPage = createMockPage();
    const result = await execute(mockPage as any, handle, {});
    expect(result.outcome).toEqual({ message: 'runtime-generated' });
  });

  it('computation on step outcomes in scenario body', async () => {
    const child = defineTest({
      code: 'computation-child',
      params: z.object({ prefix: z.string() }),
      outcome: z.object({ value: z.string() }),
      scenario: async (t, params) => {
        const data = await t.action(
          'Generate value',
          z.object({ value: z.string() }),
          async () => ({ value: `${params.prefix}-data` }),
        );
        return { value: data.value };
      },
    });

    const parent = defineTest({
      code: 'computation-parent',
      params: z.object({}),
      outcome: z.object({ combined: z.string() }),
      scenario: async (t) => {
        const a = await t.step('Get A', child, { prefix: 'first' });
        const b = await t.step('Get B', child, { prefix: 'second' });
        // String concat on step outcomes — works in both dry-run and execution
        const combined = `${a.value} + ${b.value}`;
        return { combined };
      },
      standalone: { params: {} },
    });

    // Dry-run: computation works on fake values
    const dryRunResult = await dryRun(parent, {});
    expect(dryRunResult.stepTree).toHaveLength(2);

    // Execution: computation works on real values
    const mockPage = createMockPage();
    const result = await execute(mockPage as any, parent, {});
    expect(result.outcome).toEqual({ combined: 'first-data + second-data' });
  });

  it('error propagation with context', async () => {
    const child = defineTest({
      code: 'error-child',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async (t) => {
        await t.action('Failing step', z.object({}), async () => {
          throw new Error('Connection refused');
        });
        return {};
      },
    });

    const parent = defineTest({
      code: 'error-parent',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async (t) => {
        await t.step('Run failing child', child, {});
        return {};
      },
      standalone: { params: {} },
    });

    const mockPage = createMockPage();
    await expect(execute(mockPage as any, parent, {})).rejects.toThrow(
      /Step 'Run failing child'.*Action 'Failing step'.*Connection refused/,
    );
  });

  it('step tree determinism enforcement', async () => {
    // Create a test where dry-run and execution produce different trees
    let isExecuting = false;

    const handle = defineTest({
      code: 'non-deterministic',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async (t) => {
        await t.action('Always present', z.object({}), async () => {
          isExecuting = true;
          return {};
        });
        // This check only appears during execution (closure ran and set flag)
        // Note: In dry-run, closures don't execute, so isExecuting stays false
        if (isExecuting) {
          await t.check('Conditional check', async () => {});
        }
        return {};
      },
      standalone: { params: {} },
    });

    const mockPage = createMockPage();

    // Dry-run captures 1 step (action only)
    const dryRunResult = await dryRun(handle, {});
    expect(dryRunResult.stepTree).toHaveLength(1);

    // Execution captures 2 steps (action + conditional check)
    isExecuting = false; // reset
    const executionResult = await execute(mockPage as any, handle, {});
    expect(executionResult.stepTree).toHaveLength(2);

    // Comparison detects the mismatch
    const mismatch = compareStepTrees(
      'non-deterministic',
      dryRunResult.stepTree,
      executionResult.stepTree,
    );
    expect(mismatch).not.toBeNull();
    expect(mismatch!.message).toContain('Step count mismatch');
    expect(mismatch!.message).toContain('conditional steps');
  });
});
