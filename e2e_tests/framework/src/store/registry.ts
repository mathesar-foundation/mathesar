import type { TestHandle, TaskHandle } from '../types';

/** A handle stored in the registry — either legacy TestHandle or new TaskHandle. */
export type RegisteredHandle = TestHandle | TaskHandle;

export interface RegisteredEntry {
  handle: RegisteredHandle;
  standaloneParams?: unknown;
}

/**
 * Check if a registered handle is a TaskHandle (new model).
 * TaskHandle has `taskFn`; TestHandle has `scenarioFn`.
 */
export function isTaskHandle(handle: RegisteredHandle): handle is TaskHandle {
  return 'taskFn' in handle;
}

/**
 * Check if a registered handle is a legacy TestHandle.
 */
export function isTestHandle(handle: RegisteredHandle): handle is TestHandle {
  return 'scenarioFn' in handle;
}

class TestRegistry {
  private tests = new Map<string, RegisteredEntry>();

  /**
   * Register a handle (TestHandle or TaskHandle). Generic so callers pass
   * fully-typed handles without casting. Type erasure happens here.
   */
  register<P, O>(handle: TestHandle<P, O> | TaskHandle<P, O>, standaloneParams?: P): void {
    const existing = this.tests.get(handle.code);
    if (existing) {
      throw new Error(
        `Duplicate test code '${handle.code}'. Each test code must be unique.`,
      );
    }
    this.tests.set(handle.code, {
      handle: handle as RegisteredHandle,
      standaloneParams,
    });
  }

  get(code: string): RegisteredEntry | undefined {
    return this.tests.get(code);
  }

  getAll(): RegisteredEntry[] {
    return Array.from(this.tests.values());
  }

  getStandalone(): RegisteredEntry[] {
    return this.getAll().filter((e) => e.standaloneParams !== undefined);
  }

  has(code: string): boolean {
    return this.tests.has(code);
  }

  clear(): void {
    this.tests.clear();
  }
}

export const registry = new TestRegistry();
