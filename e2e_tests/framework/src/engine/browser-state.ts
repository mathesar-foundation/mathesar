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

/**
 * Check whether browser state changed between two snapshots.
 *
 * Detects: new/removed/changed cookies, new/removed/changed localStorage entries.
 * Ignores: cookie order, expires timestamps, httpOnly/secure/sameSite metadata.
 */
export function browserStateChanged(
  before: NormalizedBrowserState,
  after: NormalizedBrowserState,
): boolean {
  // Check cookies: size change catches additions/removals
  if (before.cookies.size !== after.cookies.size) return true;
  for (const [key, val] of after.cookies) {
    if (before.cookies.get(key) !== val) return true;
  }

  // Check localStorage: size change catches new/removed origins
  if (before.localStorage.size !== after.localStorage.size) return true;
  for (const [origin, afterEntries] of after.localStorage) {
    const beforeEntries = before.localStorage.get(origin);
    if (!beforeEntries || beforeEntries.size !== afterEntries.size) return true;
    for (const [key, val] of afterEntries) {
      if (beforeEntries.get(key) !== val) return true;
    }
  }

  return false;
}

/**
 * Take a normalized browser state snapshot from a Playwright page.
 */
export async function snapshotBrowserState(
  page: Page,
): Promise<NormalizedBrowserState> {
  const state = await page.context().storageState();
  return normalizeBrowserState(state as StorageState);
}
