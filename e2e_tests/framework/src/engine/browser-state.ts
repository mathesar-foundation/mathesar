import type { Page } from '@playwright/test';

/**
 * Normalized browser state for reliable comparison.
 *
 * Extracts only meaningful state from Playwright's storageState():
 * - Cookie names, values, domains, and paths (ignores expires, httpOnly, secure, sameSite)
 * - localStorage key-value pairs per origin
 *
 * This makes comparison order-independent and immune to timestamp drift.
 */
export interface NormalizedBrowserState {
  /** Map of "name|domain|path" → value */
  cookies: Map<string, string>;
  /** Map of "origin" → Map of "key" → value */
  localStorage: Map<string, Map<string, string>>;
}

interface StorageStateCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
}

interface StorageStateOrigin {
  origin: string;
  localStorage: Array<{ name: string; value: string }>;
}

interface StorageState {
  cookies: StorageStateCookie[];
  origins: StorageStateOrigin[];
}

export function normalizeBrowserState(
  state: StorageState,
): NormalizedBrowserState {
  const cookies = new Map<string, string>();
  for (const c of state.cookies) {
    cookies.set(`${c.name}|${c.domain}|${c.path}`, c.value);
  }

  const localStorage = new Map<string, Map<string, string>>();
  for (const origin of state.origins) {
    const entries = new Map<string, string>();
    for (const item of origin.localStorage) {
      entries.set(item.name, item.value);
    }
    if (entries.size > 0) {
      localStorage.set(origin.origin, entries);
    }
  }

  return { cookies, localStorage };
}

/** A single difference between two browser state snapshots. */
export interface BrowserStateChange {
  kind: 'cookie' | 'localStorage';
  action: 'added' | 'removed' | 'changed';
  /**
   * Human-readable locator for the changed entry — tells the user where in
   * browser storage to inspect. Includes cookie name + domain/path, or
   * localStorage key + origin.
   */
  label: string;
}

/**
 * Enumerate every difference between two browser state snapshots.
 *
 * Detects: new/removed/changed cookies, new/removed/changed localStorage entries.
 * Ignores: cookie order, expires timestamps, httpOnly/secure/sameSite metadata.
 *
 * Empty result = states are equivalent.
 */
export function describeBrowserStateChanges(
  before: NormalizedBrowserState,
  after: NormalizedBrowserState,
): BrowserStateChange[] {
  const changes: BrowserStateChange[] = [];

  // Cookies: walk the union of keys so we see both additions and removals.
  const cookieKeys = new Set<string>([
    ...before.cookies.keys(),
    ...after.cookies.keys(),
  ]);
  for (const key of cookieKeys) {
    const beforeVal = before.cookies.get(key);
    const afterVal = after.cookies.get(key);
    if (beforeVal === afterVal) continue;

    const [name, domain, path] = key.split('|');
    const label = `${name} (domain=${domain}, path=${path})`;
    if (beforeVal === undefined) {
      changes.push({ kind: 'cookie', action: 'added', label });
    } else if (afterVal === undefined) {
      changes.push({ kind: 'cookie', action: 'removed', label });
    } else {
      changes.push({ kind: 'cookie', action: 'changed', label });
    }
  }

  // localStorage: walk the union of origins, then the union of keys per origin.
  const origins = new Set<string>([
    ...before.localStorage.keys(),
    ...after.localStorage.keys(),
  ]);
  for (const origin of origins) {
    const beforeEntries = before.localStorage.get(origin) ?? new Map<string, string>();
    const afterEntries = after.localStorage.get(origin) ?? new Map<string, string>();
    const keys = new Set<string>([
      ...beforeEntries.keys(),
      ...afterEntries.keys(),
    ]);
    for (const key of keys) {
      const beforeVal = beforeEntries.get(key);
      const afterVal = afterEntries.get(key);
      if (beforeVal === afterVal) continue;

      const label = `${key} @ ${origin}`;
      if (beforeVal === undefined) {
        changes.push({ kind: 'localStorage', action: 'added', label });
      } else if (afterVal === undefined) {
        changes.push({ kind: 'localStorage', action: 'removed', label });
      } else {
        changes.push({ kind: 'localStorage', action: 'changed', label });
      }
    }
  }

  return changes;
}

/**
 * Check whether browser state changed between two snapshots.
 *
 * Thin wrapper over {@link describeBrowserStateChanges} — use that instead
 * when you need to know *what* changed, not just whether anything did.
 */
export function browserStateChanged(
  before: NormalizedBrowserState,
  after: NormalizedBrowserState,
): boolean {
  return describeBrowserStateChanges(before, after).length > 0;
}

/**
 * Format a warning for a task that modified browser state without a restore hook.
 *
 * The message enumerates which cookies / localStorage entries changed, so the
 * dev knows exactly where to look in browser storage, and tells them where in
 * the code to add the restore hook.
 */
export function formatMissingRestoreHookWarning(
  taskCode: string,
  changes: BrowserStateChange[],
): string {
  const lines = [
    `\u26a0 Task '${taskCode}' modified browser state but has no restore hook.`,
    `  Detected changes (inspect these in browser storage):`,
  ];
  for (const c of changes) {
    lines.push(`    - ${c.kind} ${c.action}: ${c.label}`);
  }
  lines.push(
    `  Fix: add a \`restore\` function to defineTask({ code: '${taskCode}', ... }) ` +
      `so this state is re-established when the task is served from cache.`,
  );
  return lines.join('\n');
}

/**
 * Take a normalized browser state snapshot from a Playwright page.
 */
export async function snapshotBrowserState(
  page: Page,
): Promise<NormalizedBrowserState> {
  const state = await page.context().storageState();
  return normalizeBrowserState(state);
}
