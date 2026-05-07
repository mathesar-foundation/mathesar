import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import { taskExecute } from '../engine/task-executor';
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

/**
 * Add a cookie to the mock page's context to simulate a browser state change
 * from inside an action closure.
 */
async function addMockCookie(
  fixtures: TestFixtures,
  name: string,
  value: string,
): Promise<void> {
  await (fixtures.page.context() as unknown as {
    addCookies: (c: Array<{ name: string; value: string; url?: string }>) => Promise<void>;
  }).addCookies([{ name, value, url: 'http://localhost' }]);
}

describe('per-step attribution of browser state changes', () => {
  it('does NOT warn when a parent only composes sub-tasks that mutate state', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Child's own action mutates state, and child HAS a restoreFn
    const child = quickTaskHandle(
      'child-with-restore',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.action('Mutate state', {
          schema: z.object({}),
          fn: async (fx) => {
            await addMockCookie(fx, 'sessionid', 'abc');
            return {};
          },
        });
        return {};
      },
      { restore: async () => {} },
    );

    // Parent only composes the child — no own action/check state changes.
    const parent = quickTaskHandle(
      'parent-compose-only',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.ensure(child, {});
        return {};
      },
    );

    const fixtures = createMockFixtures() as unknown as TestFixtures;
    await taskExecute(fixtures, parent, {});

    // Neither child (has restoreFn) nor parent (no own changes) should warn.
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('warns ONLY about the parent task\'s own changes, not sub-task changes', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Child mutates 'sessionid' but has a restoreFn.
    const child = quickTaskHandle(
      'child-sets-sessionid',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.action('Set sessionid', {
          schema: z.object({}),
          fn: async (fx) => {
            await addMockCookie(fx, 'sessionid', 'session-abc');
            return {};
          },
        });
        return {};
      },
      { restore: async () => {} },
    );

    // Parent composes the child AND does its own mutation of a different cookie.
    const parent = quickTaskHandle(
      'parent-mutates-theme',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.ensure(child, {});
        await t.action('Set theme cookie', {
          schema: z.object({}),
          fn: async (fx) => {
            await addMockCookie(fx, 'theme', 'dark');
            return {};
          },
        });
        return {};
      },
    );

    const fixtures = createMockFixtures() as unknown as TestFixtures;
    await taskExecute(fixtures, parent, {});

    // Exactly ONE warning — for the parent — naming only 'theme', not 'sessionid'.
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const msg = warnSpy.mock.calls[0][0] as string;
    expect(msg).toContain(`Task 'parent-mutates-theme'`);
    expect(msg).toContain('theme (domain=localhost, path=/)');
    expect(msg).not.toContain('sessionid');
    warnSpy.mockRestore();
  });

  it('warns for a leaf task whose own action mutates state and has no restoreFn', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const leaf = quickTaskHandle(
      'leaf-no-restore',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.action('Set sessionid', {
          schema: z.object({}),
          fn: async (fx) => {
            await addMockCookie(fx, 'sessionid', 'xyz');
            return {};
          },
        });
        return {};
      },
    );

    const fixtures = createMockFixtures() as unknown as TestFixtures;
    await taskExecute(fixtures, leaf, {});

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const msg = warnSpy.mock.calls[0][0] as string;
    expect(msg).toContain(`Task 'leaf-no-restore'`);
    expect(msg).toContain('sessionid (domain=localhost, path=/)');
    warnSpy.mockRestore();
  });

  it('does NOT warn when the task has a restoreFn covering its own changes', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const leaf = quickTaskHandle(
      'leaf-with-restore',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.action('Set sessionid', {
          schema: z.object({}),
          fn: async (fx) => {
            await addMockCookie(fx, 'sessionid', 'xyz');
            return {};
          },
        });
        return {};
      },
      { restore: async () => {} },
    );

    const fixtures = createMockFixtures() as unknown as TestFixtures;
    await taskExecute(fixtures, leaf, {});

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('attributes mutations inside t.check closures to the task', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const task = quickTaskHandle(
      'task-mutates-in-check',
      z.object({}),
      z.object({}),
      async (t) => {
        await t.check('Navigate and inadvertently set cookie', async (fx) => {
          await addMockCookie(fx, 'csrftoken', 'new');
        });
        return {};
      },
    );

    const fixtures = createMockFixtures() as unknown as TestFixtures;
    await taskExecute(fixtures, task, {});

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const msg = warnSpy.mock.calls[0][0] as string;
    expect(msg).toContain(`Task 'task-mutates-in-check'`);
    expect(msg).toContain('csrftoken');
    warnSpy.mockRestore();
  });
});
