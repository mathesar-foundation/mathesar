import { describe, it, expect } from 'vitest';
import { makeCacheKey, stableStringify } from '../engine/cache-key';

describe('stableStringify', () => {
  it('produces identical output for objects with different key order', () => {
    const a = { user: 'admin', password: 'secret' };
    const b = { password: 'secret', user: 'admin' };
    expect(stableStringify(a)).toBe(stableStringify(b));
  });

  it('sorts keys at every nesting level', () => {
    const a = { outer: { z: 1, a: 2 }, inner: { y: 3, b: 4 } };
    const b = { inner: { b: 4, y: 3 }, outer: { a: 2, z: 1 } };
    expect(stableStringify(a)).toBe(stableStringify(b));
  });

  it('handles arrays (order-sensitive)', () => {
    expect(stableStringify([1, 2, 3])).toBe('[1,2,3]');
    expect(stableStringify([1, 2, 3])).not.toBe(stableStringify([3, 2, 1]));
  });

  it('handles empty objects', () => {
    expect(stableStringify({})).toBe('{}');
  });

  it('handles empty arrays', () => {
    expect(stableStringify([])).toBe('[]');
  });

  it('handles primitives', () => {
    expect(stableStringify('hello')).toBe('"hello"');
    expect(stableStringify(42)).toBe('42');
    expect(stableStringify(true)).toBe('true');
    expect(stableStringify(false)).toBe('false');
  });

  it('handles null and undefined', () => {
    expect(stableStringify(null)).toBe('null');
    expect(stableStringify(undefined)).toBe('undefined');
  });

  it('handles nested arrays in objects', () => {
    const a = { items: [{ z: 1, a: 2 }], name: 'test' };
    const b = { name: 'test', items: [{ a: 2, z: 1 }] };
    expect(stableStringify(a)).toBe(stableStringify(b));
  });

  it('distinguishes different values', () => {
    expect(stableStringify({ a: 1 })).not.toBe(stableStringify({ a: 2 }));
    expect(stableStringify({ a: 'x' })).not.toBe(stableStringify({ a: 'y' }));
  });
});

describe('makeCacheKey', () => {
  it('produces same key for same code and params regardless of key order', () => {
    const key1 = makeCacheKey('login', { user: 'admin', password: 'secret' });
    const key2 = makeCacheKey('login', { password: 'secret', user: 'admin' });
    expect(key1).toBe(key2);
  });

  it('produces different keys for different params', () => {
    const key1 = makeCacheKey('login', { user: 'admin', password: 'secret' });
    const key2 = makeCacheKey('login', { user: 'viewer', password: 'secret' });
    expect(key1).not.toBe(key2);
  });

  it('produces different keys for different test codes', () => {
    const key1 = makeCacheKey('login', { user: 'admin' });
    const key2 = makeCacheKey('install', { user: 'admin' });
    expect(key1).not.toBe(key2);
  });

  it('includes test code as prefix', () => {
    const key = makeCacheKey('login', { user: 'admin' });
    expect(key).toMatch(/^login:/);
  });

  it('produces same key for empty params', () => {
    const key1 = makeCacheKey('install', {});
    const key2 = makeCacheKey('install', {});
    expect(key1).toBe(key2);
  });

  it('hash portion is 12 hex characters', () => {
    const key = makeCacheKey('test', { x: 1 });
    const hash = key.split(':')[1];
    expect(hash).toMatch(/^[0-9a-f]{12}$/);
  });
});
