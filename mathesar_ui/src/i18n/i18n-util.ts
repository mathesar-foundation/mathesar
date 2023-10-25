import { initExtendDictionary } from 'typesafe-i18n/utils';
import type { Locales, Translations } from './i18n-types';

export const extendDictionary = initExtendDictionary<Translations>();

export function addTranslationsToGlobalObject(
  locale: Locales,
  translations: Translations,
) {
  /**
   * This function is being called by all of the translations files
   * The base translation file is being loaded by the typesafe-i18n utility
   * to generate types during the development time.
   * Hence this function also runs in the context of node
   * instead of just browser.
   */
  if (typeof window === 'undefined') return;
  window.Mathesar = {
    ...window.Mathesar,
    displayLanguage: locale,
    translations: {
      ...window.Mathesar?.translations,
      [locale]: translations,
    },
  };
}
