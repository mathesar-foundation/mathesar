import { describe, it, expect } from 'vitest';
import {
  normalizeBrowserState,
  browserStateChanged,
  describeBrowserStateChanges,
  formatMissingRestoreHookWarning,
} from '../engine/browser-state';

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

describe('describeBrowserStateChanges', () => {
  it('returns empty array when nothing changed', () => {
    const state = makeState([{ name: 'sid', value: 'x' }]);
    const before = normalizeBrowserState(state);
    const after = normalizeBrowserState(state);
    expect(describeBrowserStateChanges(before, after)).toEqual([]);
  });

  it('labels an added cookie with its name, domain, and path', () => {
    const before = normalizeBrowserState(makeState());
    const after = normalizeBrowserState(
      makeState([{ name: 'sessionid', value: 'x', domain: 'example.com', path: '/app' }]),
    );
    expect(describeBrowserStateChanges(before, after)).toEqual([
      { kind: 'cookie', action: 'added', label: 'sessionid (domain=example.com, path=/app)' },
    ]);
  });

  it('labels a removed cookie', () => {
    const before = normalizeBrowserState(makeState([{ name: 'sid', value: 'x' }]));
    const after = normalizeBrowserState(makeState());
    expect(describeBrowserStateChanges(before, after)).toEqual([
      { kind: 'cookie', action: 'removed', label: 'sid (domain=localhost, path=/)' },
    ]);
  });

  it('labels a changed cookie', () => {
    const before = normalizeBrowserState(makeState([{ name: 'sid', value: 'old' }]));
    const after = normalizeBrowserState(makeState([{ name: 'sid', value: 'new' }]));
    expect(describeBrowserStateChanges(before, after)).toEqual([
      { kind: 'cookie', action: 'changed', label: 'sid (domain=localhost, path=/)' },
    ]);
  });

  it('labels added localStorage with its key and origin', () => {
    const before = normalizeBrowserState(makeState());
    const after = normalizeBrowserState(
      makeState([], [
        { origin: 'http://localhost:8000', localStorage: [{ name: 'theme', value: 'dark' }] },
      ]),
    );
    expect(describeBrowserStateChanges(before, after)).toEqual([
      { kind: 'localStorage', action: 'added', label: 'theme @ http://localhost:8000' },
    ]);
  });

  it('labels a changed localStorage entry', () => {
    const before = normalizeBrowserState(
      makeState([], [
        { origin: 'http://localhost', localStorage: [{ name: 'k', value: 'old' }] },
      ]),
    );
    const after = normalizeBrowserState(
      makeState([], [
        { origin: 'http://localhost', localStorage: [{ name: 'k', value: 'new' }] },
      ]),
    );
    expect(describeBrowserStateChanges(before, after)).toEqual([
      { kind: 'localStorage', action: 'changed', label: 'k @ http://localhost' },
    ]);
  });

  it('labels a removed localStorage entry', () => {
    const before = normalizeBrowserState(
      makeState([], [
        { origin: 'http://localhost', localStorage: [{ name: 'k', value: 'v' }] },
      ]),
    );
    const after = normalizeBrowserState(makeState());
    expect(describeBrowserStateChanges(before, after)).toEqual([
      { kind: 'localStorage', action: 'removed', label: 'k @ http://localhost' },
    ]);
  });

  it('reports multiple changes across cookies and localStorage', () => {
    const before = normalizeBrowserState(makeState([{ name: 'sid', value: 'old' }]));
    const after = normalizeBrowserState(
      makeState(
        [{ name: 'sid', value: 'new' }, { name: 'csrftoken', value: 'c' }],
        [{ origin: 'http://localhost', localStorage: [{ name: 'theme', value: 'dark' }] }],
      ),
    );
    const changes = describeBrowserStateChanges(before, after);
    expect(changes).toHaveLength(3);
    expect(changes).toContainEqual({
      kind: 'cookie',
      action: 'changed',
      label: 'sid (domain=localhost, path=/)',
    });
    expect(changes).toContainEqual({
      kind: 'cookie',
      action: 'added',
      label: 'csrftoken (domain=localhost, path=/)',
    });
    expect(changes).toContainEqual({
      kind: 'localStorage',
      action: 'added',
      label: 'theme @ http://localhost',
    });
  });
});

describe('formatMissingRestoreHookWarning', () => {
  it('includes the task code, every change, and a pointer to the fix', () => {
    const msg = formatMissingRestoreHookWarning('connect-database', [
      { kind: 'cookie', action: 'added', label: 'sessionid (domain=localhost, path=/)' },
      { kind: 'localStorage', action: 'changed', label: 'theme @ http://localhost' },
    ]);
    expect(msg).toContain(`Task 'connect-database' modified browser state`);
    expect(msg).toContain('inspect these in browser storage');
    expect(msg).toContain('cookie added: sessionid (domain=localhost, path=/)');
    expect(msg).toContain('localStorage changed: theme @ http://localhost');
    expect(msg).toContain(`defineTask({ code: 'connect-database', ... })`);
    expect(msg).toContain('restore');
  });
});
