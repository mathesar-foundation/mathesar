import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';
import { defineTest } from '../engine/define-test';
import { execute } from '../engine/executor';
import { dryRun } from '../engine/dry-run';
import { OutcomeStore, outcomeStore } from '../store/outcome-store';
import { makeCacheKey } from '../engine/cache-key';
import { compareStepTrees } from '../engine/step-tree-compare';
import { createMockFixtures, resetRegistry } from './test-utils';

let testOutcomeDir: string;

beforeEach(() => {
  resetRegistry();
  // Use a unique temp directory per test to avoid conflicts
  testOutcomeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'outcome-test-'));
  // Clear the singleton store's in-memory cache and its files
  outcomeStore.clear();
});

describe('caching integration', () => {
  it('t.step() uses cached outcome on second execution', async () => {
    let childClosureCount = 0;

    const child = defineTest({
      code: 'cache-child',
      params: z.object({}),
      outcome: z.object({ id: z.number() }),
      scenario: async (t) => {
        // Counter inside the closure — only runs during real execution, not dry-run
        return await t.action(
          'Create item',
          z.object({ id: z.number() }),
          async () => {
            childClosureCount++;
            return { id: 100 };
          },
        );
      },
    });

    const parent = defineTest({
      code: 'cache-parent',
      params: z.object({}),
      outcome: z.object({ childId: z.number() }),
      scenario: async (t) => {
        const result = await t.step('Run child', child, {});
        return { childId: result.id };
      },
      standalone: { params: {} },
    });

    const mockFixtures = createMockFixtures();

    // First execution: child runs
    const result1 = await execute(mockFixtures as any, parent, {});
    expect(result1.outcome).toEqual({ childId: 100 });
    expect(childClosureCount).toBe(1);

    // Second execution: child is cached, closure should not re-execute
    childClosureCount = 0;
    const result2 = await execute(mockFixtures as any, parent, {});
    expect(result2.outcome).toEqual({ childId: 100 });
    expect(childClosureCount).toBe(0); // cached — closure not re-executed
  });

  it('step tree matches between dry-run and cache-hit execution', async () => {
    const child = defineTest({
      code: 'tree-child',
      params: z.object({ name: z.string() }),
      outcome: z.object({ processed: z.string() }),
      scenario: async (t, params) => {
        return await t.action(
          'Process name',
          z.object({ processed: z.string() }),
          async () => ({ processed: `done-${params.name}` }),
        );
      },
    });

    const parent = defineTest({
      code: 'tree-parent',
      params: z.object({}),
      outcome: z.object({ value: z.string() }),
      scenario: async (t) => {
        const result = await t.step('Process it', child, { name: 'test' });
        return { value: result.processed };
      },
      standalone: { params: {} },
    });

    const mockFixtures = createMockFixtures();

    // Execute once to populate cache
    await execute(mockFixtures as any, parent, {});

    // Dry-run parent to get expected tree
    const dryRunResult = await dryRun(parent, {});

    // Execute again (child will be cached)
    const result2 = await execute(mockFixtures as any, parent, {});

    // Step trees should match despite child being cached
    const mismatch = compareStepTrees('tree-parent', dryRunResult.stepTree, result2.stepTree);
    expect(mismatch).toBeNull();
  });

  it('different params produce different cache entries', async () => {
    let lastParams: unknown;

    const child = defineTest({
      code: 'params-child',
      params: z.object({ name: z.string() }),
      outcome: z.object({ result: z.string() }),
      scenario: async (t, params) => {
        lastParams = params;
        return await t.action(
          'Process',
          z.object({ result: z.string() }),
          async () => ({ result: `result-${params.name}` }),
        );
      },
    });

    const parent = defineTest({
      code: 'params-parent',
      params: z.object({}),
      outcome: z.object({ first: z.string(), second: z.string() }),
      scenario: async (t) => {
        const a = await t.step('Call A', child, { name: 'alpha' });
        const b = await t.step('Call B', child, { name: 'beta' });
        return { first: a.result, second: b.result };
      },
      standalone: { params: {} },
    });

    const mockFixtures = createMockFixtures();
    const result = await execute(mockFixtures as any, parent, {});

    // Both run because params differ
    expect(result.outcome).toEqual({
      first: 'result-alpha',
      second: 'result-beta',
    });
  });

  it('restore hooks fire on cache hit in correct order', async () => {
    const restoreLog: string[] = [];

    const install = defineTest({
      code: 'restore-install',
      params: z.object({}),
      outcome: z.object({ user: z.string() }),
      restore: async (_page, outcome) => {
        restoreLog.push(`restore-install:${outcome.user}`);
      },
      scenario: async (t) => {
        return await t.action(
          'Install app',
          z.object({ user: z.string() }),
          async () => ({ user: 'admin' }),
        );
      },
    });

    const login = defineTest({
      code: 'restore-login',
      params: z.object({}),
      outcome: z.object({ token: z.string() }),
      restore: async (_page, outcome) => {
        restoreLog.push(`restore-login:${outcome.token}`);
      },
      scenario: async (t) => {
        await t.step('Install', install, {});
        return await t.action(
          'Log in',
          z.object({ token: z.string() }),
          async () => ({ token: 'tok123' }),
        );
      },
    });

    const consumer = defineTest({
      code: 'restore-consumer',
      params: z.object({}),
      outcome: z.object({ done: z.boolean() }),
      scenario: async (t) => {
        await t.step('Login', login, {});
        return await t.action(
          'Do work',
          z.object({ done: z.boolean() }),
          async () => ({ done: true }),
        );
      },
      standalone: { params: {} },
    });

    const mockFixtures = createMockFixtures();

    // First: execute login standalone (populates install + login caches via t.step)
    // We need to execute login's outcome via a parent so t.step stores it.
    // Execute login directly first (this caches install via t.step internally):
    const loginResult = await execute(mockFixtures as any, login, {});
    // Manually store login's outcome so it's available as a cache hit:
    const loginCacheKey = makeCacheKey('restore-login', {});
    outcomeStore.set(loginCacheKey, loginResult.outcome, loginResult.subSteps);

    restoreLog.length = 0;

    // Now execute consumer — login is cached, so restore hooks should fire
    await execute(mockFixtures as any, consumer, {});

    // install.restore fires first (transitive dep), then login.restore
    expect(restoreLog).toEqual([
      'restore-install:admin',
      'restore-login:tok123',
    ]);
  });

  it('outcome store records subSteps for recursive restore', async () => {
    const child = defineTest({
      code: 'substep-child',
      params: z.object({}),
      outcome: z.object({ v: z.number() }),
      scenario: async (t) => {
        return await t.action('Act', z.object({ v: z.number() }), async () => ({ v: 1 }));
      },
    });

    const parent = defineTest({
      code: 'substep-parent',
      params: z.object({}),
      outcome: z.object({ total: z.number() }),
      scenario: async (t) => {
        const c = await t.step('Child step', child, {});
        return { total: c.v + 1 };
      },
      standalone: { params: {} },
    });

    const mockFixtures = createMockFixtures();
    const result = await execute(mockFixtures as any, parent, {});

    expect(result.subSteps).toHaveLength(1);
    expect(result.subSteps[0].testCode).toBe('substep-child');
    expect(result.subSteps[0].cacheKey).toBe(makeCacheKey('substep-child', {}));
  });

  it('browser state warning is emitted for tests without restore hook', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const child = defineTest({
        code: 'warn-child',
        params: z.object({}),
        outcome: z.object({}),
        // No restore hook!
        scenario: async (t) => {
          return await t.action('Set cookie', z.object({}), async ({ page }) => {
            // Simulate browser state change by adding a cookie
            await (page as any).context().addCookies([
              { name: 'new-cookie', value: 'val' },
            ]);
            return {};
          });
        },
      });

      const parent = defineTest({
        code: 'warn-parent',
        params: z.object({}),
        outcome: z.object({}),
        scenario: async (t) => {
          await t.step('Run child', child, {});
          return {};
        },
        standalone: { params: {} },
      });

      const mockFixtures = createMockFixtures();
      await execute(mockFixtures as any, parent, {});

      // Warning should have been emitted for 'warn-child'
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test 'warn-child' modifies browser state"),
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('no browser state warning when restore hook exists', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const child = defineTest({
        code: 'nowarn-child',
        params: z.object({}),
        outcome: z.object({}),
        restore: async () => {},
        scenario: async (t) => {
          return await t.action('Set cookie', z.object({}), async ({ page }) => {
            await (page as any).context().addCookies([
              { name: 'new-cookie', value: 'val' },
            ]);
            return {};
          });
        },
      });

      const parent = defineTest({
        code: 'nowarn-parent',
        params: z.object({}),
        outcome: z.object({}),
        scenario: async (t) => {
          await t.step('Run child', child, {});
          return {};
        },
        standalone: { params: {} },
      });

      const mockFixtures = createMockFixtures();
      await execute(mockFixtures as any, parent, {});

      // No warning because restore hook exists
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });
});
