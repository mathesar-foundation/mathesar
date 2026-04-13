import { describe, it, expect } from 'vitest';
import { normalizeBrowserState, browserStateChanged } from '../engine/browser-state';

function makeState(
  cookies: Array<{ name: string; value: string; domain?: string; path?: string; expires?: number }> = [],
  origins: Array<{ origin: string; localStorage: Array<{ name: string; value: string }> }> = [],
) {
  return {
    cookies: cookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain ?? 'localhost',
      path: c.path ?? '/',
      expires: c.expires ?? -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax' as const,
    })),
    origins,
  };
}

describe('normalizeBrowserState', () => {
  it('extracts cookie name|domain|path as key and value as value', () => {
    const state = makeState([{ name: 'sessionid', value: 'abc', domain: 'example.com', path: '/app' }]);
    const normalized = normalizeBrowserState(state);
    expect(normalized.cookies.get('sessionid|example.com|/app')).toBe('abc');
  });

  it('extracts localStorage per origin', () => {
    const state = makeState([], [
      { origin: 'http://localhost:8000', localStorage: [{ name: 'theme', value: 'dark' }] },
    ]);
    const normalized = normalizeBrowserState(state);
    const originData = normalized.localStorage.get('http://localhost:8000');
    expect(originData?.get('theme')).toBe('dark');
  });

  it('ignores empty localStorage origins', () => {
    const state = makeState([], [
      { origin: 'http://localhost:8000', localStorage: [] },
    ]);
    const normalized = normalizeBrowserState(state);
    expect(normalized.localStorage.size).toBe(0);
  });
});

describe('browserStateChanged', () => {
  it('returns false for identical empty states', () => {
    const before = normalizeBrowserState(makeState());
    const after = normalizeBrowserState(makeState());
    expect(browserStateChanged(before, after)).toBe(false);
  });

  it('returns false for identical non-empty states', () => {
    const state = makeState([{ name: 'sid', value: 'x' }]);
    const before = normalizeBrowserState(state);
    const after = normalizeBrowserState(state);
    expect(browserStateChanged(before, after)).toBe(false);
  });

  it('detects new cookie added', () => {
    const before = normalizeBrowserState(makeState());
    const after = normalizeBrowserState(makeState([{ name: 'sid', value: 'x' }]));
    expect(browserStateChanged(before, after)).toBe(true);
  });

  it('detects cookie removed', () => {
    const before = normalizeBrowserState(makeState([{ name: 'sid', value: 'x' }]));
    const after = normalizeBrowserState(makeState());
    expect(browserStateChanged(before, after)).toBe(true);
  });

  it('detects cookie value changed', () => {
    const before = normalizeBrowserState(makeState([{ name: 'sid', value: 'old' }]));
    const after = normalizeBrowserState(makeState([{ name: 'sid', value: 'new' }]));
    expect(browserStateChanged(before, after)).toBe(true);
  });

  it('ignores cookie order', () => {
    const before = normalizeBrowserState(
      makeState([{ name: 'a', value: '1' }, { name: 'b', value: '2' }]),
    );
    const after = normalizeBrowserState(
      makeState([{ name: 'b', value: '2' }, { name: 'a', value: '1' }]),
    );
    expect(browserStateChanged(before, after)).toBe(false);
  });

  it('ignores expires timestamp differences', () => {
    const before = normalizeBrowserState(
      makeState([{ name: 'sid', value: 'x', expires: 1000 }]),
    );
    const after = normalizeBrowserState(
      makeState([{ name: 'sid', value: 'x', expires: 2000 }]),
    );
    expect(browserStateChanged(before, after)).toBe(false);
  });

  it('detects new localStorage entry', () => {
    const before = normalizeBrowserState(makeState());
    const after = normalizeBrowserState(makeState([], [
      { origin: 'http://localhost', localStorage: [{ name: 'k', value: 'v' }] },
    ]));
    expect(browserStateChanged(before, after)).toBe(true);
  });

  it('detects localStorage value changed', () => {
    const before = normalizeBrowserState(makeState([], [
      { origin: 'http://localhost', localStorage: [{ name: 'k', value: 'old' }] },
    ]));
    const after = normalizeBrowserState(makeState([], [
      { origin: 'http://localhost', localStorage: [{ name: 'k', value: 'new' }] },
    ]));
    expect(browserStateChanged(before, after)).toBe(true);
  });

  it('detects localStorage entry removed', () => {
    const before = normalizeBrowserState(makeState([], [
      { origin: 'http://localhost', localStorage: [{ name: 'k', value: 'v' }] },
    ]));
    const after = normalizeBrowserState(makeState());
    expect(browserStateChanged(before, after)).toBe(true);
  });
});
