import { transifexApi } from '@transifex/api';
import { storeTranslationToDisk } from 'typesafe-i18n/importer';
import fetch from 'node-fetch';
import { logger, promptTransifexToken } from './utils';
import {
  TRANSIFEX_ORG_SLUG,
  TRANSIFEX_PROJECT_SLUG,
  TRANSIFEX_FE_RESOURCE_SLUG,
  TRANSIFEX_HOST,
} from './constants';
import type { BaseTranslation, Locales } from '../i18n-types';

async function fetchTranslations() {
  const TRANSIFEX_TOKEN =
    process.env.TRANSIFEX_TOKEN ?? (await promptTransifexToken());

  transifexApi.setup({
    auth: TRANSIFEX_TOKEN,
    host: TRANSIFEX_HOST,
  });

  /**
   * Following lines that requires interaction with the Transifex SDK
   * requires a ton of eslint-disables and @ts-expect-errors
   * due to incorrect typings provided by the package
   */

  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  const organization = await transifexApi.Organization.get({
    slug: TRANSIFEX_ORG_SLUG,
  });
  // @ts-expect-error Incorrect typings from the package
  const projects = await organization.fetch('projects');
  // @ts-expect-error Incorrect typings from the package
  const project = await projects.get({ slug: TRANSIFEX_PROJECT_SLUG });
  const resources = await project.fetch('resources');
  const resource = await resources.get({ slug: TRANSIFEX_FE_RESOURCE_SLUG });

  const languages = await project.fetch('languages');
  await languages.fetch();

  const translationsMappings: [Locales, BaseTranslation][] = await Promise.all(
    // @ts-expect-error Incorrect typings from the package
    languages.data.map(async (language) => {
      const languageCode = language.attributes.code as string;
      logger.info(`Fetching translations url for ${languageCode}`);
      const url =
        // @ts-expect-error Incorrect typings from the package
        (await transifexApi.ResourceTranslationsAsyncDownload.download({
          resource,
          language,
        })) as string;

      logger.info(`Fetching translations json for ${languageCode}`);
      const response = await fetch(url);
      const translations: BaseTranslation = await response.json();
      return [languageCode, translations];
    }),
  );
  /* eslint-enable */

  return translationsMappings;
}

async function downloadAndImport() {
  const translationsMappings = await fetchTranslations();

  await Promise.all(
    translationsMappings.map(async (translationsMapping) => {
      const [locale, translations] = translationsMapping;
      logger.info(`Saving translations for ${locale}`);
      await storeTranslationToDisk({
        locale,
        translations,
      });
    }),
  );
}

void downloadAndImport();
