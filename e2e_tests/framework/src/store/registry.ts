import type { TestHandle } from '../types';

export interface RegisteredEntry {
  handle: TestHandle;
  standaloneParams?: unknown;
}

class TestRegistry {
  private tests = new Map<string, RegisteredEntry>();

  register(handle: TestHandle, standaloneParams?: unknown): void {
    const existing = this.tests.get(handle.code);
    if (existing) {
      throw new Error(
        `Duplicate test code '${handle.code}'. Each test code must be unique.`,
      );
    }
    this.tests.set(handle.code, { handle, standaloneParams });
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
