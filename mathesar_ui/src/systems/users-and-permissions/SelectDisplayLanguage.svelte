<script lang="ts">
  import { Select } from '@mathesar-component-library';
  import type { Locales } from '@mathesar/i18n/i18n-types';
  import { preloadCommonData } from '@mathesar/utils/preloadData';

  const commonData = preloadCommonData();
  const supportedLanguages = commonData?.supported_languages ?? {};
  const locales = Object.keys(supportedLanguages);

  export let value: Locales | undefined = undefined;

  function getLabel(locale: string | undefined) {
    if (locale === undefined) {
      return '';
    }
    const localeLabel = supportedLanguages[locale];
    return `${localeLabel} (${locale})`;
  }
</script>

<Select {...$$restProps} options={locales} bind:value {getLabel} />
