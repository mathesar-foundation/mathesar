import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { defineTask } from '../engine/define-task';
import { defineScenario } from '../engine/define-scenario';
import { scenarioDryRun } from '../engine/scenario-dry-run';
import { scenarioExecute } from '../engine/scenario-executor';
import { runScenarioFlow } from '../engine/scenario-runner';
import { compareTaskStepTrees } from '../engine/task-step-tree-compare';
import { buildTaskDag, computeTaskLevels } from '../engine/task-dag';
import { registry } from '../store/registry';
import { outcomeStore } from '../store/outcome-store';
import { resourceStore } from '../store/resource-store';
import { createMockFixtures } from './test-utils';
import type { TaskContext, TestFixtures } from '../types';

beforeEach(() => {
  registry.clear();
  outcomeStore.clear();
  resourceStore.clear();
});

describe('defineScenario registration', () => {
  it('registers scenario in the scenario registry', () => {
    defineScenario({
      code: 'test-scenario',
      description: 'A test scenario',
      scenario: async () => {},
    });

    expect(registry.getScenario('test-scenario')).toBeDefined();
    expect(registry.getScenario('test-scenario')!.handle.code).toBe(
      'test-scenario',
    );
    expect(registry.getScenario('test-scenario')!.handle.description).toBe(
      'A test scenario',
    );
  });

  it('prevents duplicate scenario codes', () => {
    defineScenario({
      code: 'duplicate',
      description: 'First',
      scenario: async () => {},
    });

    expect(() =>
      defineScenario({
        code: 'duplicate',
        description: 'Second',
        scenario: async () => {},
      }),
    ).toThrow(/Duplicate code/);
  });

  it('prevents scenario code from colliding with task code', () => {
    defineTask({
      code: 'shared-code',
      params: z.object({}),
      outcome: z.object({}),
      task: async () => ({}),
    });

    expect(() =>
      defineScenario({
        code: 'shared-code',
        description: 'Collides with task',
        scenario: async () => {},
      }),
    ).toThrow(/Duplicate code/);
  });

  it('prevents task code from colliding with scenario code', () => {
    defineScenario({
      code: 'shared-code',
      description: 'A scenario',
      scenario: async () => {},
    });

    expect(() =>
      defineTask({
        code: 'shared-code',
        params: z.object({}),
        outcome: z.object({}),
        task: async () => ({}),
      }),
    ).toThrow(/Duplicate test code/);
  });

  it('has() returns true for scenario codes', () => {
    defineScenario({
      code: 'my-scenario',
      description: 'A scenario',
      scenario: async () => {},
    });

    expect(registry.has('my-scenario')).toBe(true);
  });
});

describe('scenario dry-run', () => {
  it('captures ensure/perform/action/check nodes', async () => {
    const child = defineTask({
      code: 'child-task',
      params: z.object({ name: z.string() }),
      outcome: z.object({ value: z.number() }),
      task: async (t: TaskContext) => {
        await t.action('Do something', {
          schema: z.object({ value: z.number() }),
          fn: async () => ({ value: 42 }),
        });
        return { value: 42 };
      },
    });

    const handle = defineScenario({
      code: 'full-scenario',
      description: 'Tests all node types',
      scenario: async (t) => {
        await t.ensure(child, { name: 'a' });
        await t.perform(child, { name: 'b' });
        await t.action('Direct action', {
          schema: z.object({}),
          fn: async () => ({}),
        });
        await t.check('Verify something', async () => {});
      },
    });

    const result = await scenarioDryRun(handle);

    expect(result.stepTree).toHaveLength(4);
    expect(result.stepTree[0].type).toBe('ensure');
    expect(result.stepTree[1].type).toBe('perform');
    expect(result.stepTree[2].type).toBe('action');
    expect(result.stepTree[3].type).toBe('check');

    // Ensure/perform nodes have children from the sub-task dry-run
    if (result.stepTree[0].type === 'ensure') {
      expect(result.stepTree[0].taskCode).toBe('child-task');
      expect(result.stepTree[0].children).toHaveLength(1); // the 'Do something' action
    }
  });
});

describe('scenario execution', () => {
  it('runs action and check closures', async () => {
    const calls: string[] = [];

    const child = defineTask({
      code: 'exec-child',
      params: z.object({}),
      outcome: z.object({ v: z.number() }),
      task: async (t: TaskContext) => {
        calls.push('child-task');
        return await t.action('Child action', {
          schema: z.object({ v: z.number() }),
          fn: async () => {
            calls.push('child-action');
            return { v: 1 };
          },
        });
      },
    });

    const handle = defineScenario({
      code: 'exec-scenario',
      description: 'Execution test',
      scenario: async (t) => {
        await t.ensure(child, {});
        await t.action('Scenario action', {
          schema: z.object({}),
          fn: async () => {
            calls.push('scenario-action');
            return {};
          },
        });
        await t.check('Scenario check', async () => {
          calls.push('scenario-check');
        });
      },
    });

    const fixtures = createMockFixtures() as unknown as TestFixtures;
    const result = await scenarioExecute(fixtures, handle);

    expect(calls).toContain('child-task');
    expect(calls).toContain('child-action');
    expect(calls).toContain('scenario-action');
    expect(calls).toContain('scenario-check');
    expect(result.stepTree).toHaveLength(3); // ensure, action, check
  });
});

describe('scenario step tree comparison', () => {
  it('dry-run and execution step trees match', async () => {
    const child = defineTask({
      code: 'compare-child',
      params: z.object({}),
      outcome: z.object({}),
      task: async (t: TaskContext) => {
        await t.action('Child action', {
          schema: z.object({}),
          fn: async () => ({}),
        });
        return {};
      },
    });

    const handle = defineScenario({
      code: 'compare-scenario',
      description: 'Step tree comparison test',
      scenario: async (t) => {
        await t.ensure(child, {});
        await t.action('Do thing', {
          schema: z.object({}),
          fn: async () => ({}),
        });
        await t.check('Verify', async () => {});
      },
    });

    const dryRunResult = await scenarioDryRun(handle);
    const fixtures = createMockFixtures() as unknown as TestFixtures;
    const execResult = await scenarioExecute(fixtures, handle);

    const mismatch = compareTaskStepTrees(
      'compare-scenario',
      dryRunResult.stepTree,
      execResult.stepTree,
    );
    expect(mismatch).toBeNull();
  });
});

describe('runScenarioFlow', () => {
  it('runs the full pipeline: dry-run, execute, compare', async () => {
    const child = defineTask({
      code: 'flow-child',
      params: z.object({}),
      outcome: z.object({ done: z.boolean() }),
      task: async (t: TaskContext) => {
        return await t.action('Child work', {
          schema: z.object({ done: z.boolean() }),
          fn: async () => ({ done: true }),
        });
      },
    });

    defineScenario({
      code: 'flow-scenario',
      description: 'Full pipeline test',
      scenario: async (t) => {
        const result = await t.ensure(child, {});
        await t.check('Child completed', async () => {});
      },
    });

    const fixtures = createMockFixtures() as unknown as TestFixtures;

    // Should not throw
    await runScenarioFlow(fixtures, 'flow-scenario');
  });

  it('throws for unregistered scenario', async () => {
    const fixtures = createMockFixtures() as unknown as TestFixtures;
    await expect(runScenarioFlow(fixtures, 'nonexistent')).rejects.toThrow(
      /not found in registry/,
    );
  });
});

describe('scenario DAG integration', () => {
  it('scenarios appear in DAG with correct level', async () => {
    const leaf = defineTask({
      code: 'dag-leaf',
      params: z.object({}),
      outcome: z.object({ v: z.number() }),
      task: async (t: TaskContext) => {
        return await t.action('Leaf work', {
          schema: z.object({ v: z.number() }),
          fn: async () => ({ v: 1 }),
        });
      },
      standalone: { params: {} },
    });

    const mid = defineTask({
      code: 'dag-mid',
      params: z.object({}),
      outcome: z.object({}),
      task: async (t: TaskContext) => {
        await t.ensure(leaf, {});
        return {};
      },
      standalone: { params: {} },
    });

    defineScenario({
      code: 'dag-scenario',
      description: 'Scenario in DAG',
      scenario: async (t) => {
        await t.ensure(mid, {});
        await t.check('All good', async () => {});
      },
    });

    const dag = await buildTaskDag();
    expect(dag.errors).toHaveLength(0);

    // Scenario should be in the DAG
    const scenarioNode = dag.nodes.get('dag-scenario');
    expect(scenarioNode).toBeDefined();
    expect(scenarioNode!.isScenario).toBe(true);
    expect(scenarioNode!.hasStandalone).toBe(true);
    expect(scenarioNode!.composedTasks).toContain('dag-mid');

    // Level should be higher than its dependencies
    const levels = computeTaskLevels(dag);
    expect(levels.get('dag-leaf')).toBe(0);
    expect(levels.get('dag-mid')).toBe(1);
    expect(levels.get('dag-scenario')).toBe(2);
  });

  it('scenarios compose tasks correctly via ensure/perform', async () => {
    const taskA = defineTask({
      code: 'comp-a',
      params: z.object({}),
      outcome: z.object({}),
      task: async () => ({}),
      standalone: { params: {} },
    });

    const taskB = defineTask({
      code: 'comp-b',
      params: z.object({}),
      outcome: z.object({}),
      task: async () => ({}),
      standalone: { params: {} },
    });

    defineScenario({
      code: 'comp-scenario',
      description: 'Composes two tasks',
      scenario: async (t) => {
        await t.ensure(taskA, {});
        await t.perform(taskB, {});
      },
    });

    const dag = await buildTaskDag();
    expect(dag.errors).toHaveLength(0);

    const scenarioNode = dag.nodes.get('comp-scenario');
    expect(scenarioNode).toBeDefined();
    expect(scenarioNode!.composedTasks).toContain('comp-a');
    expect(scenarioNode!.composedTasks).toContain('comp-b');
  });
});
