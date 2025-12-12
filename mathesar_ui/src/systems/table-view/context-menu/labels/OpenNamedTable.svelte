<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Identifier from '@mathesar/components/Identifier.svelte';
  import { RichText } from '@mathesar/components/rich-text';

  export let name: string;
</script>

<RichText text={$_('open_named_table')} let:slotName>
  {#if slotName === 'tableName'}
    <Identifier>{name}</Identifier>
  {/if}
</RichText>
