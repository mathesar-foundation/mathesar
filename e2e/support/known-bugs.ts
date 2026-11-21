import type { TestDetails } from '@playwright/test';

/**
 * Details for a test that asserts behaviour which is wrong today, so that a
 * rewrite of the front end does not change it unnoticed. The bug and the
 * correct behaviour are described under the same id in KNOWN_BUGS.md, next to
 * a `test.fixme` that asserts the correct behaviour.
 */
export function pinsKnownBug(id: string): TestDetails {
  return {
    tag: '@known-bug',
    annotation: { type: 'known-bug', description: id },
  };
}
