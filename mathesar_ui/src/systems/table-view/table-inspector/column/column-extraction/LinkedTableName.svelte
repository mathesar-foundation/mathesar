<script lang="ts">
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import type { LinkedTable } from './columnExtractionTypes';

  export let linkedTable: LinkedTable;

  $: ({ columns, table } = linkedTable);
</script>

<span class="linked-table-name">
  <span class="table">
    <TableName {table} bold truncate={false} />
  </span>
  <span class="columns">
    via
    {#each columns as column}
      <ProcessedColumnName processedColumn={column} truncate={false} bold />
    {/each}
  </span>
</span>
