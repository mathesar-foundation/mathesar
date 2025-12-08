import { describe, it, expect } from 'vitest';
import { normalizeColumnId } from './columnUtils';

describe('normalizeColumnId', () => {
  it('returns undefined for null/undefined/empty/whitespace/non-numeric', () => {
    expect(normalizeColumnId(null)).toBeUndefined();
    expect(normalizeColumnId(undefined)).toBeUndefined();
    expect(normalizeColumnId('')).toBeUndefined();
    expect(normalizeColumnId('   ')).toBeUndefined();
    expect(normalizeColumnId('abc')).toBeUndefined();
  });

  it('parses numeric strings correctly', () => {
    expect(normalizeColumnId('0')).toBe(0);
    expect(normalizeColumnId('42')).toBe(42);
    expect(normalizeColumnId('  7 ')).toBe(7);
    expect(normalizeColumnId('-3')).toBe(-3);
  });
});
