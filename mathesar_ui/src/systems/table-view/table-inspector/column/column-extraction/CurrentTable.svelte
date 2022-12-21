<script lang="ts">
  import type { TableEntry } from '@mathesar/api/types/tables';
  import TableName from '@mathesar/components/TableName.svelte';

  export let table: Pick<TableEntry, 'name'> | undefined = undefined;
</script>

{#if table}
  <TableName {table} truncate={false} bold />
{:else}
  the current table
{/if}
