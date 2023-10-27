import { initI18nSvelte } from 'typesafe-i18n/svelte';
import type {
  Formatters,
  Locales,
  TranslationFunctions,
  Translations,
} from './i18n-types';
import { loadedFormatters, loadedLocales } from './i18n-store';

const { locale, LL, setLocale } = initI18nSvelte<
  Locales,
  Translations,
  TranslationFunctions,
  Formatters
>(loadedLocales, loadedFormatters);

export { locale, LL, setLocale };

export default LL;
