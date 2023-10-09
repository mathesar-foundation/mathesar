import { initExtendDictionary } from 'typesafe-i18n/utils';
import type { Locales, Translations } from './i18n-types';

export const extendDictionary = initExtendDictionary<Translations>();

export function addTranslationsToGlobalObject(
  locale: Locales,
  translations: Translations,
) {
  if (typeof window === 'undefined') return;
  window.Mathesar = {
    ...window.Mathesar,
    translations: {
      ...window.Mathesar?.translations,
      [locale]: translations,
    },
  };
}
