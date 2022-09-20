<script lang="ts">
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import type { LinkedTable } from './columnExtractionTypes';

  export let linkedTable: LinkedTable;

  $: ({ columns, table } = linkedTable);
</script>

<span class="linked-table-name">
  <span class="table">
    <TableName {table} />
  </span>
  <span class="columns">
    via
    {#each columns as column}
      <ProcessedColumnName processedColumn={column} />
    {/each}
  </span>
</span>

<style>
  .linked-table-name {
    display: flex;
    align-items: center;
  }
  .columns {
    margin-left: 0.7rem;
    font-size: var(--text-size-x-small);
    opacity: 0.7;
    font-style: italic;
  }
</style>
