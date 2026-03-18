import { z } from 'zod';
import type { TestHandle, ScenarioFn } from '../types';
import { dryRun, type DryRunResult } from '../engine/dry-run';
import { execute, type ExecutionResult } from '../engine/executor';
import { registry } from '../store/registry';

/**
 * Create a mock Page object that tracks method calls.
 * Used in executor tests where we need a Page-like object.
 */
export function createMockPage(): Record<string, unknown> & { _calls: string[] } {
  const calls: string[] = [];
  return {
    _calls: calls,
    goto: async (url: string) => {
      calls.push(`goto:${url}`);
    },
    getByRole: (role: string, opts?: { name?: string }) => ({
      click: async () => {
        calls.push(`click:${role}:${opts?.name ?? ''}`);
      },
      fill: async (value: string) => {
        calls.push(`fill:${role}:${opts?.name ?? ''}:${value}`);
      },
    }),
    getByLabel: (label: string) => ({
      fill: async (value: string) => {
        calls.push(`fill:${label}:${value}`);
      },
    }),
    getByText: (text: string) => ({
      isVisible: async () => {
        calls.push(`isVisible:${text}`);
        return true;
      },
    }),
  };
}

/**
 * Reset the registry between tests.
 */
export function resetRegistry(): void {
  registry.clear();
}

/**
 * Helper to define a quick synthetic test for testing purposes.
 * Does NOT register in the registry (use defineTest for that).
 */
export function quickHandle<TParams = Record<string, never>, TOutcome = unknown>(
  code: string,
  paramsSchema: z.ZodType<TParams>,
  outcomeSchema: z.ZodType<TOutcome>,
  scenarioFn: ScenarioFn<TParams, TOutcome>,
): TestHandle<TParams, TOutcome> {
  return {
    code,
    paramsSchema,
    outcomeSchema,
    scenarioFn,
  };
}

/**
 * Helper to dry-run a test handle and return the step tree.
 */
export async function dryRunTest<P, O>(
  handle: TestHandle<P, O>,
  params?: P,
): Promise<DryRunResult> {
  return dryRun(handle, params);
}

/**
 * Helper to execute a test handle with a mock page.
 */
export async function executeTest<P, O>(
  handle: TestHandle<P, O>,
  params: P,
  page?: unknown,
): Promise<ExecutionResult<O>> {
  const mockPage = page ?? createMockPage();
  return execute(mockPage as import('@playwright/test').Page, handle, params);
}
