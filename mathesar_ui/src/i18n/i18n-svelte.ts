import { initI18nSvelte } from 'typesafe-i18n/svelte';
import type {
  Formatters,
  Locales,
  TranslationFunctions,
  Translations,
} from './i18n-types.js';
import { loadedFormatters, loadedLocales } from './i18n-util.js';

const { locale, LL, setLocale } = initI18nSvelte<
  Locales,
  Translations,
  TranslationFunctions,
  Formatters
>(loadedLocales, loadedFormatters);

export { locale, LL, setLocale };

export default LL;
