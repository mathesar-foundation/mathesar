import { initExtendDictionary } from 'typesafe-i18n/utils';
import type { Formatters, Locales, Translations } from './i18n-types.js';

export const loadedLocales: Record<Locales, Translations> = {} as Record<
  Locales,
  Translations
>;

export const loadedFormatters: Record<Locales, Formatters> = {} as Record<
  Locales,
  Formatters
>;

export const extendDictionary = initExtendDictionary<Translations>();
