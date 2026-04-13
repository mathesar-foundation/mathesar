import type { TaskHandle, ScenarioHandle } from '../types';

export interface RegisteredEntry {
  handle: TaskHandle;
  standaloneParams?: unknown;
}

export interface RegisteredScenario {
  handle: ScenarioHandle;
}

/**
 * Check if a handle is a ScenarioHandle.
 */
export function isScenarioHandle(handle: unknown): handle is ScenarioHandle {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    'scenarioFn' in handle &&
    'description' in handle &&
    !('paramsSchema' in handle)
  );
}

class TestRegistry {
  private tests = new Map<string, RegisteredEntry>();
  private scenarios = new Map<string, RegisteredScenario>();

  /**
   * Register a TaskHandle. Generic so callers pass fully-typed handles
   * without casting. Type erasure happens here.
   */
  register<P, O>(handle: TaskHandle<P, O>, standaloneParams?: P): void {
    if (this.tests.has(handle.code) || this.scenarios.has(handle.code)) {
      throw new Error(
        `Duplicate test code '${handle.code}'. Each test code must be unique.`,
      );
    }
    this.tests.set(handle.code, {
      handle: handle as TaskHandle,
      standaloneParams,
    });
  }

  /**
   * Register a scenario. Scenario codes must not collide with task codes.
   */
  registerScenario(handle: ScenarioHandle): void {
    if (this.tests.has(handle.code) || this.scenarios.has(handle.code)) {
      throw new Error(
        `Duplicate code '${handle.code}'. Each code must be unique across tasks and scenarios.`,
      );
    }
    this.scenarios.set(handle.code, { handle });
  }

  get(code: string): RegisteredEntry | undefined {
    return this.tests.get(code);
  }

  getScenario(code: string): RegisteredScenario | undefined {
    return this.scenarios.get(code);
  }

  getAll(): RegisteredEntry[] {
    return Array.from(this.tests.values());
  }

  getAllScenarios(): RegisteredScenario[] {
    return Array.from(this.scenarios.values());
  }

  getStandalone(): RegisteredEntry[] {
    return this.getAll().filter((e) => e.standaloneParams !== undefined);
  }

  has(code: string): boolean {
    return this.tests.has(code) || this.scenarios.has(code);
  }

  clear(): void {
    this.tests.clear();
    this.scenarios.clear();
  }
}

export const registry = new TestRegistry();
