import type { Page, APIRequestContext } from '@playwright/test';
import type { TestFixtures } from '../types';
import { registry } from '../store/registry';

/**
 * Create a mock Page object that tracks method calls.
 * Used in executor tests where we need a Page-like object.
 */
export function createMockPage(): Record<string, unknown> & {
  _calls: string[];
  _cookies: Array<{ name: string; value: string; url?: string }>;
  _localStorage: Map<string, Map<string, string>>;
} {
  const calls: string[] = [];
  const cookies: Array<{ name: string; value: string; url?: string; domain?: string; path?: string }> = [];
  const localStorage = new Map<string, Map<string, string>>();

  const mockContext = {
    storageState: async () => ({
      cookies: cookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain ?? 'localhost',
        path: c.path ?? '/',
        expires: -1,
        httpOnly: false,
        secure: false,
        sameSite: 'Lax' as const,
      })),
      origins: Array.from(localStorage.entries()).map(([origin, entries]) => ({
        origin,
        localStorage: Array.from(entries.entries()).map(([name, value]) => ({ name, value })),
      })),
    }),
    addCookies: async (newCookies: Array<{ name: string; value: string; url?: string }>) => {
      for (const c of newCookies) {
        cookies.push(c);
      }
      calls.push(`addCookies:${newCookies.map((c) => c.name).join(',')}`);
    },
  };

  return {
    _calls: calls,
    _cookies: cookies,
    _localStorage: localStorage,
    context: () => mockContext,
    goto: async (url: string) => {
      calls.push(`goto:${url}`);
    },
    getByRole: (role: string, opts?: { name?: string }) => ({
      click: async () => {
        calls.push(`click:${role}:${opts?.name ?? ''}`);
      },
      fill: async (value: string) => {
        calls.push(`fill:${role}:${opts?.name ?? ''}:${value}`);
      },
    }),
    getByLabel: (label: string) => ({
      fill: async (value: string) => {
        calls.push(`fill:${label}:${value}`);
      },
    }),
    getByText: (text: string) => ({
      isVisible: async () => {
        calls.push(`isVisible:${text}`);
        return true;
      },
    }),
  };
}

/**
 * Create mock TestFixtures wrapping a mock page.
 * Use `_page` to access the mock's tracking properties (_calls, _cookies, etc.).
 */
export function createMockFixtures() {
  const mockPage = createMockPage();
  return {
    page: mockPage as unknown as Page,
    baseURL: 'http://localhost:3000',
    request: {} as APIRequestContext,
    _page: mockPage,
  };
}

/**
 * Reset the registry between tests.
 */
export function resetRegistry(): void {
  registry.clear();
}
