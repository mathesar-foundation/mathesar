import type { Page } from '@playwright/test';
import type { RequirementHandle, TestCallable } from '../types';
import { registry } from '../store/registry';
import { resolveRequirements } from './dependency-resolver';
import { outcomeStore } from '../store/outcome-store';
import { createContext } from '../store/test-context';

export type TestRef<T = unknown> = RequirementHandle<T> | TestCallable<T>;

function getOutcomeCode(ref: TestRef): string {
  if ('standaloneOutcomeCode' in ref) return ref.standaloneOutcomeCode;
  return ref.outcomeCode;
}

/**
 * Resolve all requirements for a test definition and run its flow.
 *
 * Use this inside a Playwright `test()` callback. The test file calls
 * Playwright's `test()` directly, ensuring correct file attribution in reports.
 *
 * Accepts a `TestRef` (handle or callable) or a test code `string`.
 * When a string is passed, the standalone test with that code is looked up.
 *
 * @example
 * ```ts
 * import { test } from '@playwright/test';
 * import { runFlow } from '../src/framework';
 * import '../src/tests/install';
 *
 * test('install', async ({ page }) => {
 *   await runFlow(page, 'install');
 * });
 * ```
 */
export async function runFlow(
  page: Page,
  ref: TestRef | string,
): Promise<void> {
  let testDef;

  if (typeof ref === 'string') {
    testDef = registry.getStandaloneByCode(ref);
    if (!testDef) {
      throw new Error(
        `Test with code '${ref}' not found in registry. ` +
          `Ensure the test definition file is imported.`,
      );
    }
  } else {
    const outcomeCode = getOutcomeCode(ref);
    testDef = registry.get(outcomeCode);
    if (!testDef) {
      throw new Error(`Test '${outcomeCode}' not found in registry`);
    }
  }

  const requirements = testDef.getRequirements();
  await resolveRequirements(requirements);

  const context = createContext(outcomeStore);
  await testDef.runFlow(page, context);
}
