<script lang="ts">
  import { _ } from 'svelte-i18n';
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import type { LinkedTable } from './columnExtractionTypes';

  export let linkedTable: LinkedTable;

  $: ({ columns, table } = linkedTable);
</script>

<span class="linked-table-name">
  <span class="table">
    <TableName {table} bold truncate={false} />
  </span>
  <span class="columns">
    <RichText text={$_('via_column_component')} let:slotName>
      {#if slotName === 'columnComponent'}
        {#each columns as column}
          <ProcessedColumnName processedColumn={column} truncate={false} bold />
        {/each}
      {/if}
    </RichText>
  </span>
</span>
