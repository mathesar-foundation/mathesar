import { createHash } from 'node:crypto';

/**
 * Deterministic JSON serialization that produces identical output for objects
 * with the same content regardless of key insertion order.
 *
 * Objects are sorted by key at every nesting level before serializing.
 *
 * Handles: primitives, null, undefined, arrays, nested objects.
 * Does NOT handle: Date, RegExp, Map, Set, BigInt, circular refs
 * (none of these appear in Zod-validated test params).
 */
function isRecord(value: object): value is Record<string, unknown> {
  return !Array.isArray(value);
}

export function stableStringify(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  if (isRecord(value)) {
    const keys = Object.keys(value).sort();
    const pairs = keys.map(
      (k) => JSON.stringify(k) + ':' + stableStringify(value[k]),
    );
    return '{' + pairs.join(',') + '}';
  }
  return JSON.stringify(value);
}

/**
 * Create a cache key from a test code and params.
 *
 * The key is `testCode:hash` where hash is the first 12 hex chars
 * of SHA-256 of the deterministic JSON representation of params.
 */
export function makeCacheKey(testCode: string, params: unknown): string {
  const json = stableStringify(params);
  const hash = createHash('sha256').update(json).digest('hex').slice(0, 12);
  return `${testCode}:${hash}`;
}
