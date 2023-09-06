<script lang="ts">
  import { Select } from '@mathesar-component-library';
  import { preloadCommonData } from '@mathesar/utils/preloadData';

  const commonData = preloadCommonData();
  $: supportedLanguages = commonData?.supported_languages ?? {};
  $: locales = Object.keys(supportedLanguages);

  export let value: string | undefined = undefined;

  function getLabel(locale: string | undefined) {
    if (locale === undefined) {
      return '';
    }
    const localeLabel = supportedLanguages[locale];
    return `${localeLabel} (${locale})`;
  }
</script>

<Select {...$$restProps} options={locales} bind:value {getLabel} />
