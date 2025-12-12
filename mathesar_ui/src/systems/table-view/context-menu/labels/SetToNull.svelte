<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Null from '@mathesar/components/Null.svelte';
  import { RichText } from '@mathesar/components/rich-text';

  export let cellCount: number;
</script>

<RichText
  text={$_('set_count_cells_to_value', { values: { count: cellCount } })}
  let:slotName
>
  {#if slotName === 'value'}
    <Null />
  {/if}
</RichText>
