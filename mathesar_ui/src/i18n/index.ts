import Cookies from 'js-cookie';
import { addMessages, init, register, locale } from 'svelte-i18n';
import type { LangObject } from './languages/utils';

const loaders = {
  en: () => import('./languages/en'),
  ja: () => import('./languages/ja'),
};

async function loadDictionaryAsync(
  language: LangObject['language'],
): Promise<LangObject['dictionary']> {
  const translationsModule = await loaders[language]();
  return { default: translationsModule.default.dictionary };
}

/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

function setLanguageCookie(language: LangObject['language']) {
  Cookies.set('display_language', language);
}

export async function initI18n(language: LangObject['language']) {
  register('en', () => loadDictionaryAsync('en'));
  register('ja', () => loadDictionaryAsync('ja'));

  const { translations } = window.Mathesar || {};
  const dictionary =
    translations && language ? translations[language] : undefined;
  const langObject =
    language && dictionary ? { language, dictionary } : undefined;

  if (langObject) {
    addMessages(langObject.language, langObject.dictionary);
  }

  await init({
    fallbackLocale: 'en',
    initialLocale: language,
  });
  setLanguageCookie(language);
}

export async function setLanguage(language: LangObject['language']) {
  await locale.set(language);
  setLanguageCookie(language);
}

/* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
