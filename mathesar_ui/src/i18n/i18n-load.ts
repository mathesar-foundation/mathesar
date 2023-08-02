import { initFormatters } from './formatters.js';
import type { Locales, Translations } from './i18n-types.js';
import { loadedFormatters, loadedLocales } from './i18n-util.js';

const localeTranslationLoaders = {
  ja: () => import('./ja/index.js'),
  en: () => import('./en/index.js'),
};

function updateTranslationsDictionary(
  locale: Locales,
  dictionary: Partial<Translations>,
): Translations {
  loadedLocales[locale] = { ...loadedLocales[locale], ...dictionary };
  return loadedLocales[locale];
}

export async function importLocaleAsync(
  locale: Locales,
): Promise<Translations> {
  const translationsModule = await localeTranslationLoaders[locale]();
  return translationsModule.default as unknown as Translations;
}

export function loadFormatters(locale: Locales): void {
  loadedFormatters[locale] = initFormatters(locale);
}

export async function loadLocaleAsync(locale: Locales): Promise<void> {
  updateTranslationsDictionary(locale, await importLocaleAsync(locale));
  loadFormatters(locale);
}

export function loadTranslationsIntoMemory(
  locale: Locales,
  translations: Translations,
) {
  updateTranslationsDictionary(locale, translations);
  loadFormatters(locale);
}