import { writable } from 'svelte/store';

import { uiThemePreference } from '../stores/localStorage';

export type UiThemePreference = 'light' | 'dark' | 'system';
export type ResolvedUiTheme = Exclude<UiThemePreference, 'system'>;

export const resolvedUiTheme = writable<ResolvedUiTheme>('light');

let mediaQuery: MediaQueryList | null = null;

function getSystemTheme(): ResolvedUiTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyTheme(pref: UiThemePreference) {
  const theme = pref === 'system' ? getSystemTheme() : pref;

  // Remove any existing "theme-" classes from the body element
  Array.from(document.body.classList)
    .filter((cls) => cls.startsWith('theme-'))
    .forEach((cls) => document.body.classList.remove(cls));

  document.body.classList.add(`theme-${theme}`);
  resolvedUiTheme.set(theme);
}

function onSystemThemeChange() {
  uiThemePreference.subscribe((pref) => {
    if (pref === 'system') applyTheme(pref);
  })();
}

function watchSystemThemeChanges() {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', onSystemThemeChange);
  }
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', onSystemThemeChange);
}

export function initUiTheme() {
  uiThemePreference.subscribe((pref) => applyTheme(pref));
  watchSystemThemeChanges();
}
