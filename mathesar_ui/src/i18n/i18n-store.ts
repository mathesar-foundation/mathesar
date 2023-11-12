import type { Formatters, Locales, Translations } from './i18n-types';

export const loadedLocales: Record<Locales, Translations> = {} as Record<
  Locales,
  Translations
>;

export const loadedFormatters: Record<Locales, Formatters> = {} as Record<
  Locales,
  Formatters
>;
