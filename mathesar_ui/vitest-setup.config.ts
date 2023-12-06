import { beforeAll } from 'vitest';
import { addMessages, init } from 'svelte-i18n';
import en from './src/i18n/languages/en';

beforeAll(async () => {
  addMessages('en', en.dictionary);
  await init({
    fallbackLocale: 'en',
    initialLocale: 'en',
  });
});
