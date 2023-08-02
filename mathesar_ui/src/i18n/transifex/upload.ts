import { readTranslationFromDisk } from 'typesafe-i18n/exporter';
import { transifexApi } from '@transifex/api';
import type { BaseTranslation } from 'typesafe-i18n';
import {
  TRANSIFEX_ORG_SLUG,
  TRANSIFEX_PROJECT_SLUG,
  TRANSIFEX_FE_RESOURCE_SLUG,
  TRANSIFEX_HOST,
  BASE_LOCALE,
} from './constants';
import { logger, promptTransifexToken } from './utils';

async function uploadSourceContent(
  sourceContent: BaseTranslation | BaseTranslation[],
) {
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
  const content = JSON.stringify(sourceContent);

  logger.info(`Uploading source content of length ${content.length}`);
  // @ts-expect-error Incorrect typings from the package
  await transifexApi.ResourceStringsAsyncUpload.upload({
    resource,
    content,
  });
  /* eslint-enable */

  logger.info('Source content uploaded');
}

async function exportAndUploadSourceContent() {
  const sourceLocale = BASE_LOCALE;
  const mapping = await readTranslationFromDisk(sourceLocale);
  await uploadSourceContent(mapping.translations);
}

void exportAndUploadSourceContent();
