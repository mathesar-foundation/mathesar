import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { buildDag } from '../engine/dag';
import { defineTest } from '../engine/define-test';
import { resetRegistry } from './test-utils';

beforeEach(() => {
  resetRegistry();
});

describe('buildDag', () => {
  it('builds DAG from single test with no sub-steps', async () => {
    defineTest({
      code: 'solo',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async (t) => {
        await t.action('Do thing', z.object({}), async () => ({}));
        return {};
      },
      standalone: { params: {} },
    });

    const dag = await buildDag();
    expect(dag.nodes.size).toBe(1);
    expect(dag.nodes.get('solo')).toBeDefined();
    expect(dag.nodes.get('solo')!.composedTests).toEqual([]);
    expect(dag.errors).toEqual([]);
  });

  it('builds DAG from test with sub-steps', async () => {
    const child = defineTest({
      code: 'child',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async (t) => {
        await t.action('Child action', z.object({}), async () => ({}));
        return {};
      },
      standalone: { params: {} },
    });

    defineTest({
      code: 'parent',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async (t) => {
        await t.step('Run child', child, {});
        return {};
      },
      standalone: { params: {} },
    });

    const dag = await buildDag();
    expect(dag.nodes.size).toBe(2);
    expect(dag.nodes.get('parent')!.composedTests).toEqual(['child']);
    expect(dag.errors).toEqual([]);
  });

  it('builds DAG from deeply nested composition', async () => {
    const c = defineTest({
      code: 'c',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async () => ({}),
      standalone: { params: {} },
    });

    const b = defineTest({
      code: 'b',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async (t) => {
        await t.step('Run C', c, {});
        return {};
      },
      standalone: { params: {} },
    });

    defineTest({
      code: 'a',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async (t) => {
        await t.step('Run B', b, {});
        return {};
      },
      standalone: { params: {} },
    });

    const dag = await buildDag();
    expect(dag.nodes.size).toBe(3);
    expect(dag.nodes.get('a')!.composedTests).toEqual(['b']);
    expect(dag.nodes.get('b')!.composedTests).toEqual(['c']);
    expect(dag.nodes.get('c')!.composedTests).toEqual([]);
    expect(dag.errors).toEqual([]);
  });

  it('detects direct cycles (A → B → A)', async () => {
    // We need to create a cycle. Since defineTest creates handles,
    // we can create the cycle by using handles before they're fully defined.
    // This is tricky — we'll use a late-binding approach.
    const aHandle: any = {
      code: 'cycle-a',
      paramsSchema: z.object({}),
      outcomeSchema: z.object({}),
      scenarioFn: null as any,
    };
    const bHandle: any = {
      code: 'cycle-b',
      paramsSchema: z.object({}),
      outcomeSchema: z.object({}),
      scenarioFn: null as any,
    };

    aHandle.scenarioFn = async (t: any) => {
      await t.step('Run B', bHandle, {});
      return {};
    };
    bHandle.scenarioFn = async (t: any) => {
      await t.step('Run A', aHandle, {});
      return {};
    };

    const { registry } = await import('../store/registry');
    registry.register(aHandle, {});
    registry.register(bHandle, {});

    const dag = await buildDag();
    const cycleErrors = dag.errors.filter((e) => e.type === 'cycle');
    expect(cycleErrors.length).toBeGreaterThan(0);
    expect(cycleErrors[0].message).toContain('Circular dependency');
  });

  it('handles multiple root tests (independent test trees)', async () => {
    defineTest({
      code: 'tree-a',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async () => ({}),
      standalone: { params: {} },
    });

    defineTest({
      code: 'tree-b',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async () => ({}),
      standalone: { params: {} },
    });

    const dag = await buildDag();
    expect(dag.nodes.size).toBe(2);
    expect(dag.errors).toEqual([]);
    expect(dag.topologicalOrder).toContain('tree-a');
    expect(dag.topologicalOrder).toContain('tree-b');
  });

  it('handles diamond dependencies (A → B, A → C, B → D, C → D)', async () => {
    const d = defineTest({
      code: 'd',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async () => ({}),
      standalone: { params: {} },
    });

    const b = defineTest({
      code: 'b-diamond',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async (t) => {
        await t.step('Run D', d, {});
        return {};
      },
      standalone: { params: {} },
    });

    const c = defineTest({
      code: 'c-diamond',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async (t) => {
        await t.step('Run D', d, {});
        return {};
      },
      standalone: { params: {} },
    });

    defineTest({
      code: 'a-diamond',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async (t) => {
        await t.step('Run B', b, {});
        await t.step('Run C', c, {});
        return {};
      },
      standalone: { params: {} },
    });

    const dag = await buildDag();
    expect(dag.errors).toEqual([]);
    expect(dag.nodes.get('a-diamond')!.composedTests).toContain('b-diamond');
    expect(dag.nodes.get('a-diamond')!.composedTests).toContain('c-diamond');
  });

  it('labels from step definitions appear as node names', async () => {
    const child = defineTest({
      code: 'labeled-child',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async (t) => {
        await t.action('Setup database', z.object({}), async () => ({}));
        return {};
      },
      standalone: { params: {} },
    });

    defineTest({
      code: 'labeled-parent',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async (t) => {
        await t.step('Initialize child system', child, {});
        return {};
      },
      standalone: { params: {} },
    });

    const dag = await buildDag();
    const parentNode = dag.nodes.get('labeled-parent')!;
    expect(parentNode.stepTree[0].type).toBe('step');
    if (parentNode.stepTree[0].type === 'step') {
      expect(parentNode.stepTree[0].label).toBe('Initialize child system');
    }
  });

  it('topological sort produces valid execution order', async () => {
    const leaf = defineTest({
      code: 'topo-leaf',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async () => ({}),
      standalone: { params: {} },
    });

    const mid = defineTest({
      code: 'topo-mid',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async (t) => {
        await t.step('Leaf', leaf, {});
        return {};
      },
      standalone: { params: {} },
    });

    defineTest({
      code: 'topo-root',
      params: z.object({}),
      outcome: z.object({}),
      scenario: async (t) => {
        await t.step('Mid', mid, {});
        return {};
      },
      standalone: { params: {} },
    });

    const dag = await buildDag();
    const order = dag.topologicalOrder;
    expect(order.indexOf('topo-leaf')).toBeLessThan(order.indexOf('topo-mid'));
    expect(order.indexOf('topo-mid')).toBeLessThan(order.indexOf('topo-root'));
  });
});
