<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { _ } from 'svelte-i18n';

  import DocsLink from './DocsLink.svelte';
  import { RichText } from './rich-text';

  type $$Props = ComponentProps<DocsLink>;

  export let page: $$Props['page'];
</script>

<RichText text={$_('see_docs_to_learn_more')} let:slotName let:translatedArg>
  {#if slotName === 'link'}
    <DocsLink {page}>
      {translatedArg}
    </DocsLink>
  {/if}
</RichText>
