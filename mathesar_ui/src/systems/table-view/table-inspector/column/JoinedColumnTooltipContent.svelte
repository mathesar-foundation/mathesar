<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { RichText } from '@mathesar/components/rich-text';
  import TableLink from '@mathesar/components/TableLink.svelte';
  import type { Table } from '@mathesar/models/Table';

  export let targetTable: Table | undefined = undefined;
  export let intermediateTable: Table | undefined = undefined;
</script>

{#if targetTable && intermediateTable}
  <div class="joined-column-tooltip-content">
    <RichText text={$_('joined_column_tooltip')} let:slotName>
      {#if slotName === 'targetTable'}
        <TableLink table={targetTable} />
      {:else if slotName === 'intermediateTable'}
        <TableLink table={intermediateTable} />
      {/if}
    </RichText>
  </div>
{:else}
  <div class="joined-column-tooltip-content">
    {$_('joined_column_tooltip_fallback')}
  </div>
{/if}

<style lang="scss">
  .joined-column-tooltip-content {
    line-height: 1.5;
  }
</style>
