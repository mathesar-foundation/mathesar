import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { restoreFromCache } from '../engine/restore';
import { outcomeStore } from '../store/outcome-store';
import { registry } from '../store/registry';
import { createMockFixtures, resetRegistry } from './test-utils';
import type { TaskHandle } from '../types';

beforeEach(() => {
  resetRegistry();
  outcomeStore.clear();
});

function registerHandle(
  code: string,
  restoreFn?: (fixtures: any, outcome: any) => Promise<void>,
): TaskHandle {
  const handle: TaskHandle = {
    code,
    paramsSchema: z.object({}),
    outcomeSchema: z.object({}),
    taskFn: async () => ({}),
    restoreFn,
  };
  registry.register(handle, {});
  return handle;
}

describe('restoreFromCache', () => {
  it('calls restore hook with cached outcome', async () => {
    const restoreLog: string[] = [];
    const handle = registerHandle('test-a', async (_fixtures, outcome) => {
      restoreLog.push(`restore-a:${JSON.stringify(outcome)}`);
    });

    outcomeStore.set('test-a:abc', { value: 42 }, []);

    const mockFixtures = createMockFixtures();
    await restoreFromCache(mockFixtures as any, 'test-a:abc', handle);

    expect(restoreLog).toEqual(['restore-a:{"value":42}']);
  });

  it('does nothing when there is no restore hook', async () => {
    const handle = registerHandle('test-no-restore');
    outcomeStore.set('test-no-restore:abc', { value: 1 }, []);

    const mockFixtures = createMockFixtures();
    // Should not throw
    await restoreFromCache(mockFixtures as any, 'test-no-restore:abc', handle);
  });

  it('does nothing when cache entry is missing', async () => {
    const handle = registerHandle('test-missing', async () => {
      throw new Error('should not be called');
    });

    const mockFixtures = createMockFixtures();
    // Should not throw — missing entry is silently skipped
    await restoreFromCache(mockFixtures as any, 'test-missing:xyz', handle);
  });

  it('restores transitive dependencies in depth-first order', async () => {
    const restoreLog: string[] = [];

    const leafHandle = registerHandle('leaf', async () => {
      restoreLog.push('restore-leaf');
    });
    const midHandle = registerHandle('mid', async () => {
      restoreLog.push('restore-mid');
    });
    const topHandle = registerHandle('top', async () => {
      restoreLog.push('restore-top');
    });

    // top depends on mid, mid depends on leaf
    outcomeStore.set('leaf:a', {}, []);
    outcomeStore.set('mid:b', {}, [{ testCode: 'leaf', cacheKey: 'leaf:a' }]);
    outcomeStore.set('top:c', {}, [{ testCode: 'mid', cacheKey: 'mid:b' }]);

    const mockFixtures = createMockFixtures();
    await restoreFromCache(mockFixtures as any, 'top:c', topHandle);

    // Depth-first: leaf first, then mid, then top
    expect(restoreLog).toEqual(['restore-leaf', 'restore-mid', 'restore-top']);
  });

  it('deduplicates diamond dependencies', async () => {
    const restoreLog: string[] = [];

    const sharedHandle = registerHandle('shared', async () => {
      restoreLog.push('restore-shared');
    });
    const branchAHandle = registerHandle('branch-a', async () => {
      restoreLog.push('restore-branch-a');
    });
    const branchBHandle = registerHandle('branch-b', async () => {
      restoreLog.push('restore-branch-b');
    });
    const rootHandle = registerHandle('root', async () => {
      restoreLog.push('restore-root');
    });

    // root depends on branch-a and branch-b, both depend on shared
    outcomeStore.set('shared:x', {}, []);
    outcomeStore.set('branch-a:y', {}, [{ testCode: 'shared', cacheKey: 'shared:x' }]);
    outcomeStore.set('branch-b:z', {}, [{ testCode: 'shared', cacheKey: 'shared:x' }]);
    outcomeStore.set('root:w', {}, [
      { testCode: 'branch-a', cacheKey: 'branch-a:y' },
      { testCode: 'branch-b', cacheKey: 'branch-b:z' },
    ]);

    const mockFixtures = createMockFixtures();
    await restoreFromCache(mockFixtures as any, 'root:w', rootHandle);

    // shared should only be restored once despite being in both branches
    expect(restoreLog.filter((l) => l === 'restore-shared')).toHaveLength(1);
    expect(restoreLog).toEqual([
      'restore-shared',
      'restore-branch-a',
      'restore-branch-b',
      'restore-root',
    ]);
  });
});
