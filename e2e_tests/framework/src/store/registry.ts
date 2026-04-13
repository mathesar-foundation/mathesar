import type { TestHandle } from '../types';

export interface RegisteredEntry {
  handle: TestHandle;
  standaloneParams?: unknown;
}

class TestRegistry {
  private tests = new Map<string, RegisteredEntry>();

  /**
   * Register a test handle. Generic so callers pass fully-typed handles
   * without casting. Type erasure happens here: TestHandle<P, O> is stored
   * as TestHandle (defaults to <unknown, unknown>). This is safe because
   * all retrieval paths validate with the handle's schema before use.
   */
  register<P, O>(handle: TestHandle<P, O>, standaloneParams?: P): void {
    const existing = this.tests.get(handle.code);
    if (existing) {
      throw new Error(
        `Duplicate test code '${handle.code}'. Each test code must be unique.`,
      );
    }
    // Type erasure: the generic params are lost when stored in the map.
    // This is the single controlled cast point for registry storage.
    this.tests.set(handle.code, {
      handle: handle as TestHandle,
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
