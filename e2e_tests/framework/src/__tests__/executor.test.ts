import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { execute } from '../engine/executor';
import { createMockFixtures, quickHandle, resetRegistry } from './test-utils';

beforeEach(() => {
  resetRegistry();
});

describe('execute', () => {
  it('executes action closures with fixtures', async () => {
    const mockFixtures = createMockFixtures();
    const handle = quickHandle(
      'test-action-exec',
      z.object({}),
      z.object({ name: z.string() }),
      async (t) => {
        const result = await t.action(
          'Do something',
          z.object({ name: z.string() }),
          async ({ page }) => {
            await (page as any).goto('/test');
            return { name: 'done' };
          },
        );
        return { name: result.name };
      },
    );

    const result = await execute(mockFixtures as any, handle, {});
    expect(mockFixtures._page._calls).toContain('goto:/test');
    expect(result.outcome).toEqual({ name: 'done' });
  });

  it('executes check closures with fixtures', async () => {
    const mockFixtures = createMockFixtures();
    let checkExecuted = false;
    const handle = quickHandle(
      'test-check-exec',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.check('Verify something', async ({ page }) => {
          await (page as any).goto('/check');
          checkExecuted = true;
        });
        return {};
      },
    );

    await execute(mockFixtures as any, handle, {});
    expect(checkExecuted).toBe(true);
    expect(mockFixtures._page._calls).toContain('goto:/check');
  });

  it('returns real values from action closures (not fakes)', async () => {
    const mockFixtures = createMockFixtures();
    const handle = quickHandle(
      'test-real-values',
      z.object({}),
      z.object({ name: z.string() }),
      async (t) => {
        const result = await t.action(
          'Get real data',
          z.object({ name: z.string() }),
          async () => ({ name: 'real_value' }),
        );
        return { name: result.name };
      },
    );

    const result = await execute(mockFixtures as any, handle, {});
    expect(result.outcome).toEqual({ name: 'real_value' });
  });

  it('validates action return value against Zod schema', async () => {
    const mockFixtures = createMockFixtures();
    const handle = quickHandle(
      'test-action-validation',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.action(
          'Bad action',
          z.object({ id: z.number() }),
          async () => ({ id: 'not-a-number' as any }),
        );
        return {};
      },
    );

    await expect(execute(mockFixtures as any, handle, {})).rejects.toThrow(
      /Action 'Bad action'.*invalid data/,
    );
  });

  it('validates scenario return value against outcome schema', async () => {
    const mockFixtures = createMockFixtures();
    const handle = quickHandle(
      'test-outcome-validation',
      z.object({}),
      z.object({ required: z.string() }),
      async (t) => {
        return { wrong: 'field' } as any;
      },
    );

    await expect(execute(mockFixtures as any, handle, {})).rejects.toThrow(
      /Test 'test-outcome-validation' returned invalid outcome/,
    );
  });

  it('recursively executes sub-scenarios via t.step()', async () => {
    const mockFixtures = createMockFixtures();
    const executionOrder: string[] = [];

    const childHandle = quickHandle(
      'child',
      z.object({ name: z.string() }),
      z.object({ result: z.string() }),
      async (t, params) => {
        executionOrder.push('child-start');
        const data = await t.action(
          'Child action',
          z.object({ result: z.string() }),
          async () => {
            executionOrder.push('child-action');
            return { result: `hello-${params.name}` };
          },
        );
        executionOrder.push('child-end');
        return { result: data.result };
      },
    );

    const parentHandle = quickHandle(
      'parent',
      z.object({}),
      z.object({ childResult: z.string() }),
      async (t) => {
        executionOrder.push('parent-start');
        const child = await t.step('Run child', childHandle, { name: 'world' });
        executionOrder.push('parent-end');
        return { childResult: child.result };
      },
    );

    const result = await execute(mockFixtures as any, parentHandle, {});
    expect(result.outcome).toEqual({ childResult: 'hello-world' });
    expect(executionOrder).toEqual([
      'parent-start',
      'child-start',
      'child-action',
      'child-end',
      'parent-end',
    ]);
  });

  it('executes steps in sequential order', async () => {
    const mockFixtures = createMockFixtures();
    const order: number[] = [];
    const handle = quickHandle(
      'test-sequential',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.action('Step 1', z.object({}), async () => {
          order.push(1);
          return {};
        });
        await t.action('Step 2', z.object({}), async () => {
          order.push(2);
          return {};
        });
        await t.check('Step 3', async () => {
          order.push(3);
        });
        return {};
      },
    );

    await execute(mockFixtures as any, handle, {});
    expect(order).toEqual([1, 2, 3]);
  });

  it('records step tree during execution', async () => {
    const mockFixtures = createMockFixtures();
    const handle = quickHandle(
      'test-tree-recording',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.action('Action 1', z.object({}), async () => ({}));
        await t.check('Check 1', async () => {});
        return {};
      },
    );

    const result = await execute(mockFixtures as any, handle, {});
    expect(result.stepTree).toHaveLength(2);
    expect(result.stepTree[0]).toEqual({ type: 'action', label: 'Action 1' });
    expect(result.stepTree[1]).toEqual({ type: 'check', label: 'Check 1' });
  });

  it('passes correct params to sub-scenarios', async () => {
    const mockFixtures = createMockFixtures();
    let receivedParams: unknown;

    const childHandle = quickHandle(
      'child',
      z.object({ x: z.number(), y: z.string() }),
      z.object({}),
      async (t, params) => {
        receivedParams = params;
        return {};
      },
    );

    const parentHandle = quickHandle(
      'parent',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.step('Run child', childHandle, { x: 42, y: 'hello' });
        return {};
      },
    );

    await execute(mockFixtures as any, parentHandle, {});
    expect(receivedParams).toEqual({ x: 42, y: 'hello' });
  });

  it('handles errors in action closures', async () => {
    const mockFixtures = createMockFixtures();
    const handle = quickHandle(
      'test-action-error',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.action('Failing action', z.object({}), async () => {
          throw new Error('Browser crashed');
        });
        return {};
      },
    );

    await expect(execute(mockFixtures as any, handle, {})).rejects.toThrow(
      /Action 'Failing action'.*Browser crashed/,
    );
  });

  it('handles errors in check closures', async () => {
    const mockFixtures = createMockFixtures();
    const handle = quickHandle(
      'test-check-error',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.check('Failing check', async () => {
          throw new Error('Assertion failed');
        });
        return {};
      },
    );

    await expect(execute(mockFixtures as any, handle, {})).rejects.toThrow(
      /Check 'Failing check'.*Assertion failed/,
    );
  });

  it('validates params against schema before running scenario', async () => {
    const mockFixtures = createMockFixtures();
    let scenarioCalled = false;
    const handle = quickHandle(
      'test-params-validation',
      z.object({ name: z.string() }),
      z.object({}),
      async (t) => {
        scenarioCalled = true;
        return {};
      },
    );

    await expect(
      execute(mockFixtures as any, handle, { name: 123 } as any),
    ).rejects.toThrow(/Invalid params for test 'test-params-validation'/);
    expect(scenarioCalled).toBe(false);
  });
});
