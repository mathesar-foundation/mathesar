<script lang="ts">
  import { _ } from 'svelte-i18n';

  import DocsLink from './DocsLink.svelte';
  import { RichText } from './rich-text';

  /**
   * - Should begin with a forward slash
   * - Should **not** include the base URL
   * - Should **not** include the `.md` extension
   * - Should **not** include the language prefix
   *
   * Example: `/user-guide/references/`
   */
  export let path: string;
</script>

<RichText text={$_('see_docs_to_learn_more')} let:slotName let:translatedArg>
  {#if slotName === 'link'}
    <DocsLink {path}>
      {translatedArg}
    </DocsLink>
  {/if}
</RichText>
