import type { ParamRecord } from '../types';

/**
 * Generate a deterministic outcome code from a test code and its resolved params.
 *
 * Format: `code(val1,val2,...)` with values sorted by key name.
 * Values are JSON-stringified to handle special characters.
 * Non-parameterized tests return just the code string.
 */
export function generateOutcomeCode(
  testCode: string,
  params?: ParamRecord,
): string {
  if (!params || Object.keys(params).length === 0) {
    return testCode;
  }
  const sorted = Object.entries(params).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const paramStr = sorted.map(([, v]) => JSON.stringify(v)).join(',');
  return `${testCode}(${paramStr})`;
}
