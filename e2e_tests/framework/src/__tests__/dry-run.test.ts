import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { dryRun } from '../engine/dry-run';
import { quickHandle, resetRegistry } from './test-utils';

beforeEach(() => {
  resetRegistry();
});

describe('dryRun', () => {
  it('records a single action step', async () => {
    const handle = quickHandle(
      'test-action',
      z.object({}),
      z.object({ id: z.string() }),
      async (t) => {
        const result = await t.action('Do something', z.object({ id: z.string() }), async () => {
          return { id: 'real' };
        });
        return { id: result.id };
      },
    );

    const result = await dryRun(handle);
    expect(result.stepTree).toHaveLength(1);
    expect(result.stepTree[0]).toEqual({ type: 'action', label: 'Do something' });
  });

  it('records a single check step', async () => {
    const handle = quickHandle(
      'test-check',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.check('Verify something', async () => {});
        return {};
      },
    );

    const result = await dryRun(handle);
    expect(result.stepTree).toHaveLength(1);
    expect(result.stepTree[0]).toEqual({ type: 'check', label: 'Verify something' });
  });

  it('records multiple steps in order', async () => {
    const handle = quickHandle(
      'test-order',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.action('First action', z.object({}), async () => ({}));
        await t.check('First check', async () => {});
        await t.action('Second action', z.object({}), async () => ({}));
        return {};
      },
    );

    const result = await dryRun(handle);
    expect(result.stepTree).toHaveLength(3);
    expect(result.stepTree[0]).toEqual({ type: 'action', label: 'First action' });
    expect(result.stepTree[1]).toEqual({ type: 'check', label: 'First check' });
    expect(result.stepTree[2]).toEqual({ type: 'action', label: 'Second action' });
  });

  it('skips action closures (closure is never called)', async () => {
    let closureCalled = false;
    const handle = quickHandle(
      'test-skip-action',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.action('Skip me', z.object({}), async () => {
          closureCalled = true;
          return {};
        });
        return {};
      },
    );

    await dryRun(handle);
    expect(closureCalled).toBe(false);
  });

  it('skips check closures (closure is never called)', async () => {
    let closureCalled = false;
    const handle = quickHandle(
      'test-skip-check',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.check('Skip me', async () => {
          closureCalled = true;
        });
        return {};
      },
    );

    await dryRun(handle);
    expect(closureCalled).toBe(false);
  });

  it('returns Zod-generated fake values from action schemas', async () => {
    let capturedValue: unknown;
    const handle = quickHandle(
      'test-fake-values',
      z.object({}),
      z.object({ id: z.string() }),
      async (t) => {
        const result = await t.action(
          'Get data',
          z.object({ id: z.string() }),
          async () => ({ id: 'real' }),
        );
        capturedValue = result;
        return { id: result.id };
      },
    );

    await dryRun(handle);
    expect(capturedValue).toEqual({ id: 'fake_string' });
  });

  it('recursively dry-runs sub-scenarios via t.step()', async () => {
    const childHandle = quickHandle(
      'child',
      z.object({ name: z.string() }),
      z.object({ result: z.string() }),
      async (t, params) => {
        await t.action('Child action', z.object({}), async () => ({}));
        return { result: params.name };
      },
    );

    const parentHandle = quickHandle(
      'parent',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.step('Run child', childHandle, { name: 'test' });
        return {};
      },
    );

    const result = await dryRun(parentHandle);
    expect(result.stepTree).toHaveLength(1);
    const stepNode = result.stepTree[0];
    expect(stepNode.type).toBe('step');
    if (stepNode.type === 'step') {
      expect(stepNode.label).toBe('Run child');
      expect(stepNode.testCode).toBe('child');
      expect(stepNode.children).toHaveLength(1);
      expect(stepNode.children[0]).toEqual({ type: 'action', label: 'Child action' });
    }
  });

  it('generates fake params from test params schema', async () => {
    let receivedParams: unknown;
    const handle = quickHandle(
      'test-fake-params',
      z.object({ name: z.string(), count: z.number() }),
      z.object({}),
      async (t, params) => {
        receivedParams = params;
        return {};
      },
    );

    await dryRun(handle);
    expect(receivedParams).toEqual({ name: 'fake_string', count: 0 });
  });

  it('handles parameterless tests (empty params schema)', async () => {
    let scenarioCalled = false;
    const handle = quickHandle(
      'test-no-params',
      z.object({}),
      z.object({}),
      async (t) => {
        scenarioCalled = true;
        return {};
      },
    );

    await dryRun(handle);
    expect(scenarioCalled).toBe(true);
  });

  it('handles multiple uses of same test definition', async () => {
    const childHandle = quickHandle(
      'child',
      z.object({ name: z.string() }),
      z.object({ result: z.string() }),
      async (t, params) => {
        await t.action('Child action', z.object({}), async () => ({}));
        return { result: params.name };
      },
    );

    const parentHandle = quickHandle(
      'parent',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.step('First child', childHandle, { name: 'first' });
        await t.step('Second child', childHandle, { name: 'second' });
        return {};
      },
    );

    const result = await dryRun(parentHandle);
    expect(result.stepTree).toHaveLength(2);
    expect(result.stepTree[0].type).toBe('step');
    expect(result.stepTree[1].type).toBe('step');
    if (result.stepTree[0].type === 'step' && result.stepTree[1].type === 'step') {
      expect(result.stepTree[0].label).toBe('First child');
      expect(result.stepTree[1].label).toBe('Second child');
    }
  });

  it('handles deeply nested composition (A → B → C → D)', async () => {
    const d = quickHandle('d', z.object({}), z.object({ val: z.string() }), async (t) => {
      await t.action('D action', z.object({}), async () => ({}));
      return { val: 'd' };
    });

    const c = quickHandle('c', z.object({}), z.object({ val: z.string() }), async (t) => {
      await t.step('Run D', d, {});
      await t.action('C action', z.object({}), async () => ({}));
      return { val: 'c' };
    });

    const b = quickHandle('b', z.object({}), z.object({ val: z.string() }), async (t) => {
      await t.step('Run C', c, {});
      return { val: 'b' };
    });

    const a = quickHandle('a', z.object({}), z.object({}), async (t) => {
      await t.step('Run B', b, {});
      return {};
    });

    const result = await dryRun(a);
    expect(result.stepTree).toHaveLength(1);

    // A → B
    const bNode = result.stepTree[0];
    expect(bNode.type).toBe('step');
    if (bNode.type === 'step') {
      expect(bNode.testCode).toBe('b');
      expect(bNode.children).toHaveLength(1);

      // B → C
      const cNode = bNode.children[0];
      expect(cNode.type).toBe('step');
      if (cNode.type === 'step') {
        expect(cNode.testCode).toBe('c');
        expect(cNode.children).toHaveLength(2);

        // C → D + C action
        const dNode = cNode.children[0];
        expect(dNode.type).toBe('step');
        if (dNode.type === 'step') {
          expect(dNode.testCode).toBe('d');
          expect(dNode.children).toHaveLength(1);
          expect(dNode.children[0]).toEqual({ type: 'action', label: 'D action' });
        }
        expect(cNode.children[1]).toEqual({ type: 'action', label: 'C action' });
      }
    }
  });
});
