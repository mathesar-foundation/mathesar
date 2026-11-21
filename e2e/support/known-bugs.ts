import type { TestDetails } from '@playwright/test';

/**
 * Marks a test that asserts behaviour which is wrong today. KNOWN_BUGS.md describes
 * the bug under the same id; a `test.fixme` next to the test asserts the correct one.
 */
export function pinsKnownBug(id: string): TestDetails {
  return {
    tag: '@known-bug',
    annotation: { type: 'known-bug', description: id },
  };
}
