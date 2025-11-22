<script lang="ts">
  import { _ } from 'svelte-i18n';

  import DocsLink from '@mathesar/components/DocsLink.svelte';
  import { RichText } from '@mathesar/components/rich-text';
</script>

<RichText text={$_('setup_file_backend_help')} let:slotName let:translatedArg>
  {#if slotName === 'link'}
    <DocsLink page="fileDataType">
      {translatedArg}
    </DocsLink>
  {/if}
</RichText>
