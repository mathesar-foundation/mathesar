<script lang="ts">
  import { Select } from '@mathesar-component-library';
  import type { Language } from '@mathesar/i18n/languages/utils';
  import { preloadCommonData } from '@mathesar/utils/preloadData';

  const commonData = preloadCommonData();
  const supportedLanguages = commonData.supported_languages ?? {};
  const locales = Object.keys(supportedLanguages);

  export let value: Language | undefined = undefined;

  function getLabel(locale: string | undefined) {
    if (locale === undefined) {
      return '';
    }
    const localeLabel = supportedLanguages[locale];
    return `${localeLabel} (${locale})`;
  }
</script>

<Select {...$$restProps} options={locales} bind:value {getLabel} />
